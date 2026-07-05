package com.smartmart.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class SeenUserResponse {
    private Long userId;
    private String username;
    private String fullName;
    private LocalDateTime readAt;
}
