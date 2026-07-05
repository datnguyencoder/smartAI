package com.smartmart.service;

import com.smartmart.dto.response.NotificationResponse;
import com.smartmart.enums.NotificationType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface NotificationService {
    void createNotification(Long userId, String title, String content, Long conversationId, NotificationType type, Long senderId);
    Page<NotificationResponse> getNotifications(Long userId, Pageable pageable);
    void markAsRead(Long notificationId, Long userId);
    void markAllAsRead(Long userId);
    long getUnreadCount(Long userId);
}
