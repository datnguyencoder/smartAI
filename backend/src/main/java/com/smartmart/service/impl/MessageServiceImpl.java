package com.smartmart.service.impl;

import com.smartmart.service.MessageService;

import com.smartmart.dto.request.EditMessageRequest;
import com.smartmart.dto.request.ReplyMessageRequest;
import com.smartmart.dto.request.SendImageMessageRequest;
import com.smartmart.dto.request.SendMessageRequest;
import com.smartmart.dto.response.MessageResponse;
import com.smartmart.entity.Chat.Attachment;
import com.smartmart.entity.Chat.Conversation;
import com.smartmart.entity.Chat.Message;
import com.smartmart.entity.User;
import com.smartmart.enums.AttachmentType;
import com.smartmart.enums.ConversationStatus;
import com.smartmart.enums.MessageType;
import com.smartmart.enums.ParticipantStatus;
import com.smartmart.exception.BadRequestException;
import com.smartmart.exception.ErrorCode;
import com.smartmart.exception.ForbiddenException;
import com.smartmart.exception.NotFoundException;
import com.smartmart.repository.UserRepository;
import com.smartmart.repository.chat.AttachmentRepository;
import com.smartmart.repository.chat.ConversationParticipantRepository;
import com.smartmart.repository.chat.ConversationRepository;
import com.smartmart.repository.chat.MessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MessageServiceImpl implements MessageService {

    private final MessageRepository messageRepository;
    private final ConversationRepository conversationRepository;
    private final ConversationParticipantRepository participantRepository;
    private final AttachmentRepository attachmentRepository;
    private final UserRepository userRepository;

    private Conversation validateAndGetActiveConversation(Long conversationId, Long userId) {
        Conversation conv = conversationRepository.findByIdAndStatus(conversationId, ConversationStatus.ACTIVE)
                .orElseThrow(() -> new BadRequestException(ErrorCode.CHAT_GROUP_DELETED));

        boolean isParticipant = participantRepository.existsByConversationIdAndUserIdAndStatus(conversationId, userId, ParticipantStatus.ACTIVE);
        if (!isParticipant) {
            throw new ForbiddenException(ErrorCode.CHAT_NOT_PARTICIPANT);
        }
        return conv;
    }

    @Override
    @Transactional
    public MessageResponse sendTextMessage(Long currentUserId, SendMessageRequest request) {
        Conversation conv = validateAndGetActiveConversation(request.getConversationId(), currentUserId);
        User sender = userRepository.findById(currentUserId).orElseThrow();

        Message msg = Message.builder()
                .conversation(conv)
                .sender(sender)
                .messageType(MessageType.TEXT)
                .content(request.getContent().trim())
                .recalled(false)
                .build();
        msg = messageRepository.save(msg);

        conv.setLastMessageAt(LocalDateTime.now());
        conversationRepository.save(conv);

        return mapToMessageResponse(msg);
    }

    @Override
    @Transactional
    public MessageResponse sendImageMessage(Long currentUserId, SendImageMessageRequest request) {
        Conversation conv = validateAndGetActiveConversation(request.getConversationId(), currentUserId);
        User sender = userRepository.findById(currentUserId).orElseThrow();

        Message msg = Message.builder()
                .conversation(conv)
                .sender(sender)
                .messageType(MessageType.IMAGE)
                .content("[Hình ảnh]")
                .recalled(false)
                .build();
        msg = messageRepository.save(msg);

        Attachment attachment = new Attachment();
        attachment.setMessage(msg);
        attachment.setAttachmentType(AttachmentType.IMAGE);
        attachment.setUrl(request.getUrl());
        attachment.setPublicId(request.getPublicId());
        attachment.setFileType(request.getFileType());
        attachment.setFileSize(request.getFileSize());
        attachmentRepository.save(attachment);

        conv.setLastMessageAt(LocalDateTime.now());
        conversationRepository.save(conv);

        return mapToMessageResponse(msg);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<MessageResponse> getMessages(Long conversationId, Long currentUserId, Pageable pageable) {
        validateAndGetActiveConversation(conversationId, currentUserId);
        
        Page<Message> msgPage = messageRepository.findByConversationIdOrderByCreatedAtDesc(conversationId, pageable);
        List<MessageResponse> dtos = msgPage.getContent().stream()
                .map(this::mapToMessageResponse)
                .collect(Collectors.toList());
        
        Collections.reverse(dtos); // reverse to return oldest first
        return new PageImpl<>(dtos, pageable, msgPage.getTotalElements());
    }

    @Override
    @Transactional
    public void recallMessage(Long messageId, Long currentUserId) {
        Message msg = messageRepository.findByIdAndDeletedAtIsNull(messageId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.NOT_FOUND, "Tin nhắn không tồn tại"));

        validateAndGetActiveConversation(msg.getConversation().getId(), currentUserId);

        if (msg.getSender() == null || !msg.getSender().getId().equals(currentUserId)) {
            throw new ForbiddenException(ErrorCode.FORBIDDEN, "Bạn không thể thu hồi tin nhắn của người khác");
        }

        msg.setRecalled(true);
        msg.setContent("Tin nhắn đã bị thu hồi");
        // DO NOT set deletedAt
        messageRepository.save(msg);
    }

    @Override
    @Transactional
    public void editMessage(Long messageId, Long currentUserId, EditMessageRequest request) {
        Message msg = messageRepository.findByIdAndDeletedAtIsNull(messageId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.NOT_FOUND, "Tin nhắn không tồn tại"));

        validateAndGetActiveConversation(msg.getConversation().getId(), currentUserId);

        if (msg.getSender() == null || !msg.getSender().getId().equals(currentUserId)) {
            throw new ForbiddenException(ErrorCode.FORBIDDEN, "Bạn không thể sửa đổi tin nhắn của người khác");
        }

        if (msg.getMessageType() != MessageType.TEXT) {
            throw new BadRequestException(ErrorCode.BAD_REQUEST, "Chỉ có thể sửa tin nhắn văn bản");
        }

        if (msg.getRecalled()) {
            throw new BadRequestException(ErrorCode.BAD_REQUEST, "Tin nhắn đã bị thu hồi");
        }

        msg.setContent(request.getContent().trim());
        // AuditableEntity will automatically update 'updatedAt'
        messageRepository.save(msg);
    }

    @Override
    @Transactional
    public MessageResponse replyMessage(Long currentUserId, ReplyMessageRequest request) {
        Conversation conv = validateAndGetActiveConversation(request.getConversationId(), currentUserId);
        User sender = userRepository.findById(currentUserId).orElseThrow();

        Message replyToMsg = messageRepository.findByIdAndDeletedAtIsNull(request.getReplyToMessageId())
                .orElseThrow(() -> new NotFoundException(ErrorCode.NOT_FOUND, "Tin nhắn gốc không tồn tại"));

        if (!replyToMsg.getConversation().getId().equals(conv.getId())) {
            throw new BadRequestException(ErrorCode.BAD_REQUEST, "Tin nhắn gốc không thuộc cuộc trò chuyện này");
        }

        Message msg = Message.builder()
                .conversation(conv)
                .sender(sender)
                .messageType(MessageType.TEXT)
                .content(request.getContent().trim())
                .replyToMessage(replyToMsg)
                .recalled(false)
                .build();
        msg = messageRepository.save(msg);

        conv.setLastMessageAt(LocalDateTime.now());
        conversationRepository.save(conv);

        return mapToMessageResponse(msg);
    }

    private MessageResponse mapToMessageResponse(Message msg) {
        boolean edited = msg.getUpdatedAt() != null && !msg.getUpdatedAt().equals(msg.getCreatedAt());

        String replyContent = null;
        if (msg.getReplyToMessage() != null) {
            Message r = msg.getReplyToMessage();
            if (r.getRecalled()) {
                replyContent = "Tin nhắn đã bị thu hồi";
            } else if (r.getMessageType() == MessageType.IMAGE) {
                replyContent = "[Hình ảnh]";
            } else {
                replyContent = r.getContent();
            }
        }

        List<MessageResponse.AttachmentResponse> attachmentDtos = attachmentRepository.findByMessageId(msg.getId())
                .stream()
                .map(a -> MessageResponse.AttachmentResponse.builder()
                        .id(a.getId())
                        .type(a.getAttachmentType())
                        .url(a.getUrl())
                        .publicId(a.getPublicId())
                        .fileType(a.getFileType())
                        .fileSize(a.getFileSize())
                        .build())
                .collect(Collectors.toList());

        return MessageResponse.builder()
                .id(msg.getId())
                .conversationId(msg.getConversation().getId())
                .senderId(msg.getSender() != null ? msg.getSender().getId() : null)
                .senderName(msg.getSender() != null ? msg.getSender().getFullName() : "Hệ thống")
                .messageType(msg.getMessageType())
                .content(msg.getContent())
                .replyToMessageId(msg.getReplyToMessage() != null ? msg.getReplyToMessage().getId() : null)
                .replyToContent(replyContent)
                .edited(edited)
                .recalled(msg.getRecalled())
                .attachments(attachmentDtos)
                .createdAt(msg.getCreatedAt())
                .updatedAt(msg.getUpdatedAt())
                .build();
    }
}
