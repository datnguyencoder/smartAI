package com.smartmart.service.chat.impl;

import com.smartmart.dto.response.MemberResponse;
import com.smartmart.entity.Chat.Conversation;
import com.smartmart.entity.Chat.ConversationParticipant;
import com.smartmart.entity.Chat.Message;
import com.smartmart.entity.User;
import com.smartmart.enums.*;
import com.smartmart.exception.BadRequestException;
import com.smartmart.exception.ConflictException;
import com.smartmart.exception.ErrorCode;
import com.smartmart.exception.ForbiddenException;
import com.smartmart.exception.NotFoundException;
import com.smartmart.repository.UserRepository;
import com.smartmart.repository.chat.ConversationParticipantRepository;
import com.smartmart.repository.chat.ConversationRepository;
import com.smartmart.repository.chat.MessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ParticipantServiceImpl implements ParticipantService {

    private final ConversationRepository conversationRepository;
    private final ConversationParticipantRepository participantRepository;
    private final UserRepository userRepository;
    private final MessageRepository messageRepository;

    @Override
    @Transactional
    public void addMember(Long conversationId, Long currentUserId, Long targetUserId) {
        Conversation conv = conversationRepository.findByIdAndStatus(conversationId, ConversationStatus.ACTIVE)
                .orElseThrow(() -> new BadRequestException(ErrorCode.CHAT_GROUP_DELETED));

        if (conv.getType() != ConversationType.GROUP) {
            throw new BadRequestException(ErrorCode.BAD_REQUEST, "Chỉ có thể thêm thành viên vào GROUP");
        }

        ConversationParticipant currentParticipant = participantRepository.findByConversationIdAndUserId(conversationId, currentUserId)
                .orElseThrow(() -> new ForbiddenException(ErrorCode.CHAT_NOT_PARTICIPANT));

        if (currentParticipant.getStatus() != ParticipantStatus.ACTIVE || currentParticipant.getRole() != ParticipantRole.OWNER) {
            throw new ForbiddenException(ErrorCode.CHAT_NOT_OWNER);
        }

        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.CHAT_USER_NOT_FOUND));

        if (targetUser.getStatus() != UserStatus.ACTIVE) {
            throw new BadRequestException(ErrorCode.CHAT_USER_INACTIVE);
        }

        boolean alreadyActive = participantRepository.existsByConversationIdAndUserIdAndStatus(conversationId, targetUserId, ParticipantStatus.ACTIVE);
        if (alreadyActive) {
            throw new ConflictException(ErrorCode.CHAT_USER_ALREADY_IN_GROUP);
        }

        ConversationParticipant targetParticipant = participantRepository.findByConversationIdAndUserId(conversationId, targetUserId)
                .orElse(ConversationParticipant.builder()
                        .conversation(conv)
                        .user(targetUser)
                        .role(ParticipantRole.MEMBER)
                        .build());
        
        targetParticipant.setStatus(ParticipantStatus.ACTIVE);
        targetParticipant.setJoinedAt(LocalDateTime.now());
        participantRepository.save(targetParticipant);

        Message sysMsg = Message.builder()
                .conversation(conv)
                .messageType(MessageType.SYSTEM)
                .content(targetUser.getFullName() + " đã tham gia nhóm")
                .build();
        messageRepository.save(sysMsg);
    }

    @Override
    @Transactional
    public void removeMember(Long conversationId, Long currentUserId, Long targetUserId) {
        if (currentUserId.equals(targetUserId)) {
            throw new BadRequestException(ErrorCode.BAD_REQUEST, "Không thể tự kick chính mình");
        }

        Conversation conv = conversationRepository.findByIdAndStatus(conversationId, ConversationStatus.ACTIVE)
                .orElseThrow(() -> new BadRequestException(ErrorCode.CHAT_GROUP_DELETED));

        ConversationParticipant currentParticipant = participantRepository.findByConversationIdAndUserId(conversationId, currentUserId)
                .orElseThrow(() -> new ForbiddenException(ErrorCode.CHAT_NOT_PARTICIPANT));

        if (currentParticipant.getStatus() != ParticipantStatus.ACTIVE || currentParticipant.getRole() != ParticipantRole.OWNER) {
            throw new ForbiddenException(ErrorCode.CHAT_NOT_OWNER);
        }

        ConversationParticipant targetParticipant = participantRepository.findByConversationIdAndUserId(conversationId, targetUserId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.NOT_FOUND, "Thành viên không tồn tại trong nhóm"));

        if (targetParticipant.getStatus() == ParticipantStatus.LEFT || targetParticipant.getStatus() == ParticipantStatus.REMOVED) {
            throw new BadRequestException(ErrorCode.BAD_REQUEST, "Thành viên đã rời nhóm hoặc bị xóa");
        }

        if (targetParticipant.getRole() == ParticipantRole.OWNER) {
            throw new BadRequestException(ErrorCode.BAD_REQUEST, "Không thể kick OWNER");
        }

        targetParticipant.setStatus(ParticipantStatus.REMOVED);
        targetParticipant.setLeftAt(LocalDateTime.now());
        participantRepository.save(targetParticipant);

        Message sysMsg = Message.builder()
                .conversation(conv)
                .messageType(MessageType.SYSTEM)
                .content(targetParticipant.getUser().getFullName() + " đã bị xóa khỏi nhóm")
                .build();
        messageRepository.save(sysMsg);
    }

    @Override
    @Transactional
    public void leaveGroup(Long conversationId, Long currentUserId) {
        Conversation conv = conversationRepository.findByIdAndStatus(conversationId, ConversationStatus.ACTIVE)
                .orElseThrow(() -> new BadRequestException(ErrorCode.CHAT_GROUP_DELETED));

        ConversationParticipant participant = participantRepository.findByConversationIdAndUserId(conversationId, currentUserId)
                .orElseThrow(() -> new ForbiddenException(ErrorCode.CHAT_NOT_PARTICIPANT));

        if (participant.getStatus() != ParticipantStatus.ACTIVE) {
            throw new BadRequestException(ErrorCode.BAD_REQUEST, "Bạn không còn ở trong nhóm");
        }

        participant.setStatus(ParticipantStatus.LEFT);
        participant.setLeftAt(LocalDateTime.now());
        participantRepository.save(participant);

        if (participant.getRole() == ParticipantRole.OWNER) {
            List<ConversationParticipant> activeMembers = participantRepository.findByConversationIdAndStatus(conversationId, ParticipantStatus.ACTIVE);
            
            if (activeMembers.isEmpty()) {
                conv.setStatus(ConversationStatus.DELETED);
                conversationRepository.save(conv);
            } else {
                ConversationParticipant oldest = activeMembers.stream()
                        .min(Comparator.comparing(ConversationParticipant::getJoinedAt))
                        .orElseThrow();
                oldest.setRole(ParticipantRole.OWNER);
                participantRepository.save(oldest);
            }
        }

        Message sysMsg = Message.builder()
                .conversation(conv)
                .messageType(MessageType.SYSTEM)
                .content(participant.getUser().getFullName() + " đã rời nhóm")
                .build();
        messageRepository.save(sysMsg);
    }

    @Override
    @Transactional(readOnly = true)
    public List<MemberResponse> getMembers(Long conversationId, Long currentUserId) {
        boolean isParticipant = participantRepository.existsByConversationIdAndUserIdAndStatus(conversationId, currentUserId, ParticipantStatus.ACTIVE);
        if (!isParticipant) {
            throw new ForbiddenException(ErrorCode.CHAT_NOT_PARTICIPANT);
        }

        return participantRepository.findByConversationIdAndStatus(conversationId, ParticipantStatus.ACTIVE)
                .stream()
                .map(p -> MemberResponse.builder()
                        .userId(p.getUser().getId())
                        .username(p.getUser().getUsername())
                        .fullName(p.getUser().getFullName())
                        .role(p.getRole())
                        .status(p.getStatus())
                        .joinedAt(p.getJoinedAt())
                        .build())
                .collect(Collectors.toList());
    }
}
