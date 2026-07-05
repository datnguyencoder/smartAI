package com.smartmart.service.impl;

import com.smartmart.service.ConversationService;

import com.smartmart.dto.request.CreateGroupConversationRequest;
import com.smartmart.dto.response.ConversationDetailResponse;
import com.smartmart.dto.response.ConversationResponse;
import com.smartmart.dto.response.MemberResponse;
import com.smartmart.entity.Chat.Conversation;
import com.smartmart.entity.Chat.ConversationParticipant;
import com.smartmart.entity.Chat.Message;
import com.smartmart.entity.User;
import com.smartmart.enums.*;
import com.smartmart.exception.BadRequestException;
import com.smartmart.exception.ErrorCode;
import com.smartmart.exception.ForbiddenException;
import com.smartmart.exception.NotFoundException;
import com.smartmart.repository.UserRepository;
import com.smartmart.repository.chat.ConversationParticipantRepository;
import com.smartmart.repository.chat.ConversationRepository;
import com.smartmart.repository.chat.MessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ConversationServiceImpl implements ConversationService {

    private final ConversationRepository conversationRepository;
    private final ConversationParticipantRepository participantRepository;
    private final UserRepository userRepository;
    private final MessageRepository messageRepository;
    private final com.smartmart.repository.chat.NotificationRepository notificationRepository;

    @Override
    @Transactional
    public ConversationResponse createPrivateConversation(Long currentUserId, Long targetUserId) {
        if (currentUserId.equals(targetUserId)) {
            throw new BadRequestException(ErrorCode.CHAT_SELF_CHAT);
        }

        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.CHAT_USER_NOT_FOUND));

        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.CHAT_USER_NOT_FOUND));

        if (targetUser.getStatus() != UserStatus.ACTIVE || currentUser.getStatus() != UserStatus.ACTIVE) {
            throw new BadRequestException(ErrorCode.CHAT_USER_INACTIVE);
        }

        Optional<Conversation> existingConv = conversationRepository.findPrivateConversation(currentUserId,
                targetUserId);
        if (existingConv.isPresent()) {
            return mapToConversationResponse(existingConv.get(), currentUserId);
        }

        Conversation newConv = Conversation.builder()
                .name("PRIVATE")
                .type(ConversationType.PRIVATE)
                .status(ConversationStatus.ACTIVE)
                .createdBy(currentUser)
                .build();
        newConv = conversationRepository.save(newConv);

        ConversationParticipant p1 = ConversationParticipant.builder()
                .conversation(newConv)
                .user(currentUser)
                .role(ParticipantRole.MEMBER)
                .status(ParticipantStatus.ACTIVE)
                .joinedAt(LocalDateTime.now())
                .build();

        ConversationParticipant p2 = ConversationParticipant.builder()
                .conversation(newConv)
                .user(targetUser)
                .role(ParticipantRole.MEMBER)
                .status(ParticipantStatus.ACTIVE)
                .joinedAt(LocalDateTime.now())
                .build();

        participantRepository.saveAll(List.of(p1, p2));

        return mapToConversationResponse(newConv, currentUserId);
    }

    @Override
    @Transactional
    public ConversationResponse createGroupConversation(Long currentUserId, CreateGroupConversationRequest request) {
        if (request.getName() == null || request.getName().trim().isEmpty() || request.getName().length() > 100) {
            throw new BadRequestException(ErrorCode.CHAT_INVALID_GROUP_NAME);
        }

        List<Long> distinctMemberIds = new HashSet<>(request.getMemberIds()).stream().toList();
        if (distinctMemberIds.isEmpty()) {
            throw new BadRequestException(ErrorCode.BAD_REQUEST, "Danh sách thành viên không được rỗng");
        }

        if (!distinctMemberIds.contains(currentUserId)) {
            throw new BadRequestException(ErrorCode.BAD_REQUEST, "Danh sách thành viên phải bao gồm id của bản thân");
        }

        List<Long> targetMemberIds = distinctMemberIds.stream()
                .filter(id -> !id.equals(currentUserId))
                .collect(Collectors.toList());

        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.CHAT_USER_NOT_FOUND));

        Conversation newConv = Conversation.builder()
                .name(request.getName().trim())
                .type(ConversationType.GROUP)
                .status(ConversationStatus.ACTIVE)
                .createdBy(currentUser)
                .build();
        newConv = conversationRepository.save(newConv);

        ConversationParticipant owner = ConversationParticipant.builder()
                .conversation(newConv)
                .user(currentUser)
                .role(ParticipantRole.OWNER)
                .status(ParticipantStatus.ACTIVE)
                .joinedAt(LocalDateTime.now())
                .build();
        participantRepository.save(owner);

        for (Long memberId : targetMemberIds) {
            User member = userRepository.findById(memberId)
                    .orElseThrow(() -> new NotFoundException(ErrorCode.CHAT_USER_NOT_FOUND));
            if (member.getStatus() != UserStatus.ACTIVE) {
                throw new BadRequestException(ErrorCode.CHAT_USER_INACTIVE);
            }
            ConversationParticipant p = ConversationParticipant.builder()
                    .conversation(newConv)
                    .user(member)
                    .role(ParticipantRole.MEMBER)
                    .status(ParticipantStatus.ACTIVE)
                    .joinedAt(LocalDateTime.now())
                    .build();
            participantRepository.save(p);
        }

        return mapToConversationResponse(newConv, currentUserId);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ConversationResponse> getMyConversations(Long currentUserId, Pageable pageable) {
        return conversationRepository.findMyConversations(currentUserId, pageable)
                .map(conv -> mapToConversationResponse(conv, currentUserId));
    }

    @Override
    @Transactional(readOnly = true)
    public ConversationDetailResponse getConversationDetail(Long conversationId, Long currentUserId) {
        Conversation conv = conversationRepository.findByIdAndStatus(conversationId, ConversationStatus.ACTIVE)
                .orElseThrow(() -> new NotFoundException(ErrorCode.CHAT_CONVERSATION_NOT_FOUND));

        boolean isParticipant = participantRepository.existsByConversationIdAndUserIdAndStatus(conversationId,
                currentUserId, ParticipantStatus.ACTIVE);
        if (!isParticipant) {
            throw new ForbiddenException(ErrorCode.CHAT_NOT_PARTICIPANT);
        }

        List<MemberResponse> members = participantRepository
                .findByConversationIdAndStatus(conversationId, ParticipantStatus.ACTIVE)
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

        Long totalMsgs = messageRepository.countByConversationId(conversationId);

        ConversationResponse base = mapToConversationResponse(conv, currentUserId);

        return ConversationDetailResponse.builder()
                .id(base.getId())
                .name(base.getName())
                .type(base.getType())
                .status(base.getStatus())
                .lastMessageAt(base.getLastMessageAt())
                .createdAt(base.getCreatedAt())
                .lastMessage(base.getLastMessage())
                .unreadCount(base.getUnreadCount())
                .members(members)
                .totalMessages(totalMsgs)
                .build();
    }

    @Override
    @Transactional
    public void renameGroup(Long conversationId, Long currentUserId, String newName) {
        if (newName == null || newName.trim().isEmpty() || newName.length() > 100) {
            throw new BadRequestException(ErrorCode.CHAT_INVALID_GROUP_NAME);
        }

        Conversation conv = conversationRepository.findByIdAndStatus(conversationId, ConversationStatus.ACTIVE)
                .orElseThrow(() -> new NotFoundException(ErrorCode.CHAT_CONVERSATION_NOT_FOUND));

        if (conv.getType() != ConversationType.GROUP) {
            throw new BadRequestException(ErrorCode.CHAT_INVALID_GROUP_NAME);
        }

        ConversationParticipant participant = participantRepository
                .findByConversationIdAndUserId(conversationId, currentUserId)
                .orElseThrow(() -> new ForbiddenException(ErrorCode.CHAT_NOT_PARTICIPANT));

        if (participant.getStatus() != ParticipantStatus.ACTIVE || participant.getRole() != ParticipantRole.OWNER) {
            throw new ForbiddenException(ErrorCode.CHAT_NOT_OWNER);
        }

        conv.setName(newName.trim());
        conversationRepository.save(conv);

        Message sysMsg = Message.builder()
                .conversation(conv)
                .messageType(MessageType.SYSTEM)
                .content(participant.getUser().getFullName() + " đã đổi tên nhóm thành " + newName.trim())
                .build();
        messageRepository.save(sysMsg);
    }

    @Override
    @Transactional
    public void deleteGroup(Long conversationId, Long currentUserId) {
        Conversation conv = conversationRepository.findByIdAndStatus(conversationId, ConversationStatus.ACTIVE)
                .orElseThrow(() -> new NotFoundException(ErrorCode.CHAT_CONVERSATION_NOT_FOUND));

        if (conv.getType() != ConversationType.GROUP) {
            throw new BadRequestException(ErrorCode.BAD_REQUEST, "Chỉ có thể giải tán GROUP");
        }

        ConversationParticipant participant = participantRepository
                .findByConversationIdAndUserId(conversationId, currentUserId)
                .orElseThrow(() -> new ForbiddenException(ErrorCode.CHAT_NOT_PARTICIPANT));

        if (participant.getStatus() != ParticipantStatus.ACTIVE || participant.getRole() != ParticipantRole.OWNER) {
            throw new ForbiddenException(ErrorCode.CHAT_NOT_OWNER);
        }

        conv.setStatus(ConversationStatus.DELETED);
        conversationRepository.save(conv);
    }

    @Override
    @Transactional
    public void markConversationAsRead(Long conversationId, Long currentUserId) {
        List<com.smartmart.entity.Chat.Notification> unreadNotifs = notificationRepository
                .findByUserIdAndConversationIdAndIsReadFalse(currentUserId, conversationId);
        if (!unreadNotifs.isEmpty()) {
            unreadNotifs.forEach(n -> n.setIsRead(true));
            notificationRepository.saveAll(unreadNotifs);
        }
    }

    private ConversationResponse mapToConversationResponse(Conversation conv, Long currentUserId) {
        com.smartmart.dto.response.LastMessageResponse lastMessageObj = null;
        Page<Message> lastMessagePage = messageRepository.findByConversationIdOrderByCreatedAtDesc(conv.getId(),
                PageRequest.of(0, 1));
        if (lastMessagePage.hasContent()) {
            Message msg = lastMessagePage.getContent().get(0);
            String content;
            if (msg.getRecalled()) {
                content = "Tin nhắn đã bị thu hồi";
            } else if (msg.getMessageType() == MessageType.IMAGE) {
                content = "[Hình ảnh]";
            } else {
                content = msg.getContent();
            }
            
            String senderName = msg.getSender() != null ? msg.getSender().getFullName() : "Hệ thống";
            
            lastMessageObj = com.smartmart.dto.response.LastMessageResponse.builder()
                    .content(content)
                    .senderName(senderName)
                    .createdAt(msg.getCreatedAt())
                    .build();
        }

        String displayName = conv.getName();
        if (conv.getType() == ConversationType.PRIVATE) {
            List<ConversationParticipant> participants = participantRepository
                    .findByConversationIdAndStatus(conv.getId(), ParticipantStatus.ACTIVE);
            for (ConversationParticipant p : participants) {
                if (!p.getUser().getId().equals(currentUserId)) {
                    displayName = p.getUser().getFullName();
                    break;
                }
            }
        }

        long unreadCount = notificationRepository.countByUserIdAndConversationIdAndIsReadFalse(currentUserId, conv.getId());

        return ConversationResponse.builder()
                .id(conv.getId())
                .name(displayName)
                .type(conv.getType())
                .status(conv.getStatus())
                .lastMessageAt(conv.getLastMessageAt() != null ? conv.getLastMessageAt() : conv.getCreatedAt())
                .createdAt(conv.getCreatedAt())
                .lastMessage(lastMessageObj)
                .unreadCount(unreadCount)
                .build();
    }
}
