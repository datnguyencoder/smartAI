package com.smartmart.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Builder
public class AuditLogResponse {
    private UUID id;
    private String action;
    private String detail;
    private String username;
    private LocalDateTime createdAt;
}
