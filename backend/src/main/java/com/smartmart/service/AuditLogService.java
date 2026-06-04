package com.smartmart.service;

public interface AuditLogService {

    void log(String action, String detail);
}
