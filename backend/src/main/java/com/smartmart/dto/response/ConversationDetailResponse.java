package com.smartmart.dto.response;

import com.smartmart.enums.ConversationStatus;
import com.smartmart.enums.ConversationType;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class ConversationDetailResponse {
    private Long id;
    private String name;
    private ConversationType type;
    private ConversationStatus status;
    private LocalDateTime lastMessageAt;
    private LocalDateTime createdAt;
    private String lastMessage;
    private Long unreadCount;
    private List<MemberResponse> members;
    private Long totalMessages;
}
