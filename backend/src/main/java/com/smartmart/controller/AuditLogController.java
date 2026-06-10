package com.smartmart.controller;

import com.smartmart.common.response.ApiResponse;
import com.smartmart.dto.response.AuditLogResponse;
import com.smartmart.service.AuditLogService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Validated
@RestController
@RequestMapping("/api/v1/audit-logs")
@Tag(name = "Audit Logs", description = "Hoạt động gần đây trong hệ thống")
@SecurityRequirement(name = "bearerAuth")
public class AuditLogController {

    private final AuditLogService auditLogService;

    public AuditLogController(AuditLogService auditLogService) {
        this.auditLogService = auditLogService;
    }

    @GetMapping("/recent")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF','WAREHOUSE')")
    @Operation(summary = "Lấy hoạt động hệ thống gần đây")
    public ResponseEntity<ApiResponse<List<AuditLogResponse>>> recent(
            @RequestParam(defaultValue = "20") @Min(1) @Max(50) int limit
    ) {
        return ResponseEntity.ok(ApiResponse.success(auditLogService.listRecent(limit)));
    }
}
