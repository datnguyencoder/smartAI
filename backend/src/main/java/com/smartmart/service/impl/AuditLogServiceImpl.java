package com.smartmart.service.impl;

import com.smartmart.common.response.PageResponse;
import com.smartmart.entity.AuditLog;
import com.smartmart.entity.User;
import com.smartmart.dto.response.AuditLogResponse;
import com.smartmart.repository.AuditLogRepository;
import com.smartmart.repository.UserRepository;
import com.smartmart.security.SecurityUtils;
import com.smartmart.service.AuditLogService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.List;

@Service
public class AuditLogServiceImpl implements AuditLogService {

    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;

    public AuditLogServiceImpl(AuditLogRepository auditLogRepository, UserRepository userRepository) {
        this.auditLogRepository = auditLogRepository;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional
    public void log(String action, String detail) {
        log(action, resolveEntityType(action), null, detail, null, null);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AuditLogResponse> listRecent(int limit) {
        return auditLogRepository.findRecentBusinessActivities(PageRequest.of(0, limit)).stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public void log(String action, String entityType, String entityId, String detail, String beforeData, String afterData) {
        User user = SecurityUtils.getCurrentUserId()
                .flatMap(userRepository::findById)
                .orElse(null);
        auditLogRepository.save(AuditLog.builder()
                .action(action)
                .detail(detail)
                .entityType(entityType)
                .entityId(entityId)
                .beforeData(beforeData)
                .afterData(afterData)
                .ipAddress(getClientIpAddress())
                .user(user)
                .build());
    }

    @Override
    public PageResponse<AuditLogResponse> listAll(int page, int size) {
        Page<AuditLog> auditLogs = auditLogRepository.findAllOrderByCreatedAtDesc(PageRequest.of(page, size));
        return PageResponse.of(
                auditLogs,
                auditLogs.getContent().stream().map(this::toResponse).toList()
        );
    }

    @Override
    public PageResponse<AuditLogResponse> listByEntity(String entityType,String entityId, int page, int size) {
        PageRequest pageRequest = PageRequest.of(page, size);

        Page<AuditLog> auditLogs;

        if (entityId == null || entityId.isBlank()) {
            auditLogs = auditLogRepository.findByEntityTypeOrderByCreatedAtDesc(entityType, pageRequest);
        } else {
            auditLogs = auditLogRepository.findByEntityTypeAndEntityIdOrderByCreatedAtDesc(
                    entityType,
                    entityId,
                    pageRequest
            );
        }

        return PageResponse.of(
                auditLogs,
                auditLogs.getContent().stream().map(this::toResponse).toList()
        );
    }

    @Override
    public PageResponse<AuditLogResponse> listByUsername(String username, int page, int size) {
        String keyword = username == null ? "" : username.trim();

        Page<AuditLog> auditLogs = auditLogRepository.findByUsernameContainingIgnoreCase(
                keyword,
                PageRequest.of(page, size)
        );

        return PageResponse.of(
                auditLogs,
                auditLogs.getContent().stream().map(this::toResponse).toList()
        );
    }

    @Override
    public PageResponse<AuditLogResponse> listByAction(String action, int page, int size) {
        Page<AuditLog> auditLogs = auditLogRepository.findByActionOrderByCreatedAtDesc(action, PageRequest.of(page, size));
        return PageResponse.of(
                auditLogs,
                auditLogs.getContent().stream().map(this::toResponse).toList()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public List<String> listActions(String entityType) {
        String type = entityType == null || entityType.isBlank() ? null : entityType.trim();
        return auditLogRepository.findDistinctActions(type);
    }

    private AuditLogResponse toResponse(AuditLog auditLog) {
        User user = auditLog.getUser();
        return AuditLogResponse.builder()
                .id(auditLog.getId())
                .action(auditLog.getAction())
                .entityType(auditLog.getEntityType())
                .entityId(auditLog.getEntityId())
                .beforeData(auditLog.getBeforeData())
                .afterData(auditLog.getAfterData())
                .ipAddress(auditLog.getIpAddress())
                .detail(auditLog.getDetail())
                .username(user != null ? user.getUsername() : "Hệ thống")
                .createdAt(auditLog.getCreatedAt())
                .build();
    }
    private String resolveEntityType(String action) {
        if (action == null || action.isBlank()) {
            return "SYSTEM";
        }

        if (action.startsWith("AUTH_")) {
            return "AUTH";
        }

        if (action.startsWith("USER_")) {
            return "USER";
        }

        if (action.startsWith("ITEM_")) {
            return "ITEM";
        }

        if (action.startsWith("ORDER_")) {
            return "ORDER";
        }

        if (action.startsWith("PURCHASE_")) {
            return "PURCHASE_ORDER";
        }

        if (action.startsWith("SCRAP_")) {
            return "SCRAP_ORDER";
        }

        if (action.startsWith("AI_")) {
            return "AI";
        }

        return "SYSTEM";
    }

    private String getClientIpAddress() {
        ServletRequestAttributes attributes =
                (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();

        if (attributes == null) {
            return null;
        }

        HttpServletRequest request = attributes.getRequest();

        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }

        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) {
            return realIp;
        }

        return request.getRemoteAddr();
    }
}
