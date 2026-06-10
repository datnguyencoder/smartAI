package com.smartmart.service.impl;

import com.smartmart.entity.AuditLog;
import com.smartmart.entity.User;
import com.smartmart.dto.response.AuditLogResponse;
import com.smartmart.repository.AuditLogRepository;
import com.smartmart.repository.UserRepository;
import com.smartmart.security.SecurityUtils;
import com.smartmart.service.AuditLogService;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
        User user = SecurityUtils.getCurrentUserId()
                .flatMap(userRepository::findById)
                .orElse(null);
        auditLogRepository.save(AuditLog.builder()
                .action(action)
                .detail(detail)
                .user(user)
                .build());
    }

    @Override
    @Transactional(readOnly = true)
    public List<AuditLogResponse> listRecent(int limit) {
        return auditLogRepository.findRecentBusinessActivities(PageRequest.of(0, limit)).stream()
                .map(this::toResponse)
                .toList();
    }

    private AuditLogResponse toResponse(AuditLog auditLog) {
        User user = auditLog.getUser();
        return AuditLogResponse.builder()
                .id(auditLog.getId())
                .action(auditLog.getAction())
                .detail(auditLog.getDetail())
                .username(user != null ? user.getUsername() : "Hệ thống")
                .createdAt(auditLog.getCreatedAt())
                .build();
    }
}
