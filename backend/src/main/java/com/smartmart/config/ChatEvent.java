package com.smartmart.config;

import com.smartmart.enums.ChatEventType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatEvent<T> {
    private ChatEventType type;
    private Long conversationId;
    private Long userId;
    private T data;
}
