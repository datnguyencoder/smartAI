package com.smartmart.service.impl;

import com.smartmart.service.NotificationService;

import com.smartmart.dto.response.NotificationResponse;
import com.smartmart.entity.Chat.Conversation;
import com.smartmart.entity.Chat.Notification;
import com.smartmart.entity.User;
import com.smartmart.enums.NotificationType;
import com.smartmart.exception.ErrorCode;
import com.smartmart.exception.NotFoundException;
import com.smartmart.repository.UserRepository;
import com.smartmart.repository.chat.ConversationRepository;
import com.smartmart.repository.chat.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final ConversationRepository conversationRepository;

    @Override
    @Transactional
    public void createNotification(Long userId, String title, String content, Long conversationId, NotificationType type, Long senderId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.CHAT_USER_NOT_FOUND));

        Conversation conv = null;
        if (conversationId != null) {
            conv = conversationRepository.findById(conversationId).orElse(null);
        }

        User sender = null;
        if (senderId != null) {
            sender = userRepository.findById(senderId).orElse(null);
        }

        Notification notif = Notification.builder()
                .user(user)
                .conversation(conv)
                .title(title)
                .content(content)
                .isRead(false)
                .type(type)
                .sender(sender)
                .build();
        
        notificationRepository.save(notif);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<NotificationResponse> getNotifications(Long userId, Pageable pageable) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable)
                .map(n -> NotificationResponse.builder()
                        .id(n.getId())
                        .title(n.getTitle())
                        .content(n.getContent())
                        .conversationId(n.getConversation() != null ? n.getConversation().getId() : null)
                        .type(n.getType())
                        .isRead(n.getIsRead())
                        .createdAt(n.getCreatedAt())
                        .senderId(n.getSender() != null ? n.getSender().getId() : null)
                        .senderName(n.getSender() != null ? n.getSender().getFullName() : null)
                        .build());
    }

    @Override
    @Transactional
    public void markAsRead(Long notificationId, Long userId) {
        Notification notif = notificationRepository.findByIdAndUserId(notificationId, userId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.NOT_FOUND, "Thông báo không tồn tại"));
        notif.setIsRead(true);
        notificationRepository.save(notif);
    }

    @Override
    @Transactional
    public void markAllAsRead(Long userId) {
        List<Notification> unread = notificationRepository.findByUserIdAndIsReadFalse(userId);
        unread.forEach(n -> n.setIsRead(true));
        notificationRepository.saveAll(unread);
    }

    @Override
    @Transactional(readOnly = true)
    public long getUnreadCount(Long userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }
}
