package com.smartmart.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class AuditLogResponse {
    private Long id;
    private String action;
    private String detail;
    private String username;
    private LocalDateTime createdAt;
    private String beforeData;
    private String afterData;
    private String ipAddress;
    private String entityType;
    private String entityId;
}
