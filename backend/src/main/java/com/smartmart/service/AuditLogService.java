package com.smartmart.service;

import com.smartmart.common.response.PageResponse;
import com.smartmart.dto.response.AuditLogResponse;

import java.util.List;

public interface AuditLogService {

    void log(String action, String detail);

    List<AuditLogResponse> listRecent(int limit);

    void log(String action, String entityType, String entityId, String detail, String beforeData, String afterData);

    PageResponse<AuditLogResponse> listAll(int page, int size);
    PageResponse<AuditLogResponse> listByEntity(String entityType, String entityId, int page, int size);

    PageResponse<AuditLogResponse> listByUsername(String username, int page, int size);

    PageResponse<AuditLogResponse> listByAction(String action, int page, int size);

    List<String> listActions(String entityType);

    PageResponse<AuditLogResponse> search(
            String entityType,
            String action,
            String username,
            int page,
            int size
    );
}
