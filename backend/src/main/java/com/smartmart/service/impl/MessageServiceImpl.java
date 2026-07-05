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
import com.smartmart.config.ChatEvent;
import com.smartmart.enums.ChatEventType;
import com.smartmart.config.ChatPublisher;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class MessageServiceImpl implements MessageService {

    private final MessageRepository messageRepository;
    private final ConversationRepository conversationRepository;
    private final ConversationParticipantRepository participantRepository;
    private final AttachmentRepository attachmentRepository;
    private final UserRepository userRepository;
    private final com.smartmart.service.NotificationService notificationService;
    private final ChatPublisher chatPublisher;
    private final SimpMessagingTemplate messagingTemplate;

    private Conversation validateAndGetActiveConversation(Long conversationId, Long userId) {
        Conversation conv = conversationRepository.findByIdAndStatus(conversationId, ConversationStatus.ACTIVE)
                .orElseThrow(() -> new BadRequestException(ErrorCode.CHAT_GROUP_DELETED));

        boolean isParticipant = participantRepository.existsByConversationIdAndUserIdAndStatus(conversationId, userId,
                ParticipantStatus.ACTIVE);
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

        sendNotificationToParticipants(msg);

        MessageResponse response = mapToMessageResponse(msg);
        broadcastEvent(ChatEventType.NEW_MESSAGE, conv.getId(), response);

        return response;
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

        sendNotificationToParticipants(msg);

        MessageResponse response = mapToMessageResponse(msg);
        broadcastEvent(ChatEventType.NEW_MESSAGE, conv.getId(), response);

        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<MessageResponse> getMessages(Long conversationId, Long currentUserId, Pageable pageable) {
        validateAndGetActiveConversation(conversationId, currentUserId);

        Page<Message> msgPage = messageRepository.findByConversationIdOrderByCreatedAtDesc(conversationId, pageable);
        List<MessageResponse> dtos = msgPage.getContent().stream()
                .map(this::mapToMessageResponse)
                .collect(Collectors.toList());

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
        messageRepository.save(msg);

        broadcastEvent(ChatEventType.MESSAGE_RECALLED, msg.getConversation().getId(), mapToMessageResponse(msg));
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

        broadcastEvent(ChatEventType.MESSAGE_EDITED, msg.getConversation().getId(), mapToMessageResponse(msg));
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

        sendNotificationToParticipants(msg);

        MessageResponse response = mapToMessageResponse(msg);
        broadcastEvent(ChatEventType.NEW_MESSAGE, conv.getId(), response);

        return response;
    }

    private void broadcastEvent(ChatEventType type, Long conversationId, MessageResponse data) {
        ChatEvent<MessageResponse> event = ChatEvent.<MessageResponse>builder()
                .type(type)
                .conversationId(conversationId)
                .data(data)
                .build();

        // Direct WebSocket send (always works for single-instance)
        String destination = "/topic/chat/" + conversationId;
        log.info("Broadcasting {} to {}", type, destination);
        messagingTemplate.convertAndSend(destination, event);

        // Also publish to Redis for multi-instance (best-effort)
        try {
            chatPublisher.publish(event);
        } catch (Exception e) {
            log.warn("Redis publish failed (non-fatal for single instance): {}", e.getMessage());
        }
    }

    private void sendNotificationToParticipants(Message msg) {
        List<com.smartmart.entity.Chat.ConversationParticipant> participants = participantRepository
                .findByConversationIdAndStatus(msg.getConversation().getId(), ParticipantStatus.ACTIVE);
        for (com.smartmart.entity.Chat.ConversationParticipant p : participants) {
            if (!p.getUser().getId().equals(msg.getSender().getId())) {
                String title = msg.getConversation().getType() == com.smartmart.enums.ConversationType.GROUP
                        ? msg.getConversation().getName()
                        : msg.getSender().getFullName();

                String content = msg.getMessageType() == MessageType.IMAGE ? "[Hình ảnh]" : msg.getContent();
                notificationService.createNotification(
                        p.getUser().getId(),
                        title,
                        content,
                        msg.getConversation().getId(),
                        com.smartmart.enums.NotificationType.MESSAGE,
                        msg.getSender().getId());
            }

            // Realtime update for conversation list (notify all participants including sender across tabs)
            String destination = "/topic/notifications/" + p.getUser().getId();
            ChatEvent<MessageResponse> event = ChatEvent.<MessageResponse>builder()
                    .type(ChatEventType.NEW_MESSAGE)
                    .conversationId(msg.getConversation().getId())
                    .data(mapToMessageResponse(msg))
                    .build();
            messagingTemplate.convertAndSend(destination, event);
        }
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
