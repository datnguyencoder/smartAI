package com.smartmart.service;

import com.smartmart.dto.response.AuditLogResponse;

import java.util.List;

public interface AuditLogService {

    void log(String action, String detail);

    List<AuditLogResponse> listRecent(int limit);
}
