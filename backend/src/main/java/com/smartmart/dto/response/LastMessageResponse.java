package com.smartmart.dto.response;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
public class LastMessageResponse {
    private String content;
    private String senderName;
    private LocalDateTime createdAt;
}
