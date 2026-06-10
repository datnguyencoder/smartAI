package com.smartmart.controller;

import com.smartmart.common.response.ApiResponse;
import com.smartmart.dto.request.UpdateSettingRequest;
import com.smartmart.dto.response.SettingResponse;
import com.smartmart.service.SettingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/settings")
@Tag(name = "Settings", description = "Cấu hình hệ thống")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasRole('ADMIN')")
public class SettingController {

    private final SettingService settingService;

    public SettingController(SettingService settingService) {
        this.settingService = settingService;
    }

    @GetMapping
    @Operation(summary = "Danh sách cấu hình")
    public ResponseEntity<ApiResponse<List<SettingResponse>>> list() {
        return ResponseEntity.ok(ApiResponse.success(settingService.listAll()));
    }

    @PutMapping("/{key}")
    @Operation(summary = "Cập nhật cấu hình theo key")
    public ResponseEntity<ApiResponse<SettingResponse>> update(
            @PathVariable String key,
            @Valid @RequestBody UpdateSettingRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success("Cập nhật cấu hình thành công", settingService.update(key, request)));
    }
}
