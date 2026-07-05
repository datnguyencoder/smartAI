package com.smartmart.dto.response;

import com.smartmart.enums.NotificationType;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class NotificationResponse {
    private Long id;
    private String title;
    private String content;
    private Long conversationId;
    private NotificationType type;
    private Boolean isRead;
    private LocalDateTime createdAt;
    private Long senderId;
    private String senderName;
}
