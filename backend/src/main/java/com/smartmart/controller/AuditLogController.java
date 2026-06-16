package com.smartmart.controller;

import com.smartmart.common.response.ApiResponse;
import com.smartmart.common.response.PageResponse;
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
import org.springframework.web.bind.annotation.*;

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
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN')")
    @Operation(summary = "Lấy toàn bộ audit log")
    public ResponseEntity<ApiResponse<PageResponse<AuditLogResponse>>> listAll(
            @RequestParam(defaultValue = "0") @Min(0)  int page,
            @RequestParam(defaultValue = "10") @Min(1) @Max(100) int size)
    {
        return ResponseEntity.ok(ApiResponse.success(
                auditLogService.listAll(page, size)
        ));
    }

    @GetMapping("/entity")
    @PreAuthorize("hasAnyRole('ADMIN')")
    @Operation(summary = "Lấy audit log theo entity")
    public ResponseEntity<ApiResponse<PageResponse<AuditLogResponse>>> listByEntity(
            @RequestParam String entityType,
            @RequestParam(required = false) String entityId,
            @RequestParam(defaultValue = "0") @Min(0)  int page,
            @RequestParam(defaultValue = "10") @Min(1) @Max(100) int size
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                auditLogService.listByEntity(entityType, entityId, page, size)
        ));
    }

    @GetMapping("/action/{action}")
    @PreAuthorize("hasAnyRole('ADMIN')")
    @Operation(summary = "Lấy audit log theo action")
    public ResponseEntity<ApiResponse<PageResponse<AuditLogResponse>>> listByAction (
            @PathVariable String action,
            @RequestParam(defaultValue = "0") @Min(0)  int page,
            @RequestParam(defaultValue = "10") @Min(1) @Max(100) int size
    ){
        return ResponseEntity.ok(ApiResponse.success(
                auditLogService.listByAction(action, page, size)
        ));
    }

    @GetMapping("/username/{username}")
    @PreAuthorize("hasAnyRole('ADMIN')")
    @Operation(summary = "Lấy audit log theo username")
    public ResponseEntity<ApiResponse<PageResponse<AuditLogResponse>>> listByEntity(
            @PathVariable String username,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) @Max(100) int size
    ){
        return ResponseEntity.ok(ApiResponse.success(
                auditLogService.listByUsername(username, page, size)
        ));
    }

    @GetMapping("/actions")
    @PreAuthorize("hasAnyRole('ADMIN')")
    @Operation(summary = "Lấy danh sách hành động trong audit log")
    public ResponseEntity<ApiResponse<List<String>>> listActions(
            @RequestParam(required = false) String entityType
    ) {
        return ResponseEntity.ok(ApiResponse.success(auditLogService.listActions(entityType)));
    }

    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('ADMIN')")
    @Operation(summary = "Lọc audit log theo phân hệ, hành động và người thao tác")
    public ResponseEntity<ApiResponse<PageResponse<AuditLogResponse>>> search(
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String username,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) @Max(100) int size
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                auditLogService.search(entityType, action, username, page, size)
        ));
    }

}
