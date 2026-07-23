package com.smartmart.controller;

import com.smartmart.common.response.ApiResponse;
import com.smartmart.service.DashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/dashboard")
@Tag(name = "Dashboard", description = "Báo cáo tổng quan")
@SecurityRequirement(name = "bearerAuth")
// STAFF có trang "dashboard" trong ROLE_PAGES (frontend/src/lib/permissions.ts) và đây thường
// là trang mặc định ngay sau khi đăng nhập — @PreAuthorize class-level trước đây chỉ cho
// ADMIN/MANAGER khiến STAFF luôn nhận 403 ngay khi vào hệ thống.
@PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/summary")
    @Operation(summary = "Tóm tắt ngày")
    public ResponseEntity<ApiResponse<Map<String, Object>>> summary() {
        return ResponseEntity.ok(ApiResponse.success(dashboardService.summary()));
    }

    @GetMapping("/revenue")
    @Operation(summary = "Doanh thu 7 ngày")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> revenue() {
        return ResponseEntity.ok(ApiResponse.success(dashboardService.revenue7d()));
    }

    @GetMapping("/forecast-summary")
    @Operation(summary = "Tóm tắt dự báo AI")
    public ResponseEntity<ApiResponse<Map<String, Object>>> forecastSummary() {
        return ResponseEntity.ok(ApiResponse.success(dashboardService.forecastSummary()));
    }
}
