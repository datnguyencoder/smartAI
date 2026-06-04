package com.smartmart.controller;

import com.smartmart.common.response.ApiResponse;
import com.smartmart.dto.response.InventoryAlertResponse;
import com.smartmart.service.InventoryAlertService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/inventory-alerts")
@Tag(name = "Inventory Alerts", description = "Cảnh báo tồn kho")
@SecurityRequirement(name = "bearerAuth")
public class InventoryAlertController {

    private final InventoryAlertService inventoryAlertService;

    public InventoryAlertController(InventoryAlertService inventoryAlertService) {
        this.inventoryAlertService = inventoryAlertService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF','WAREHOUSE')")
    @Operation(summary = "Danh sách cảnh báo chưa xử lý")
    public ResponseEntity<ApiResponse<List<InventoryAlertResponse>>> list() {
        return ResponseEntity.ok(ApiResponse.success(inventoryAlertService.listUnresolved()));
    }

    @PatchMapping("/{id}/resolve")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','WAREHOUSE')")
    @Operation(summary = "Đánh dấu đã xử lý cảnh báo")
    public ResponseEntity<ApiResponse<InventoryAlertResponse>> resolve(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Đã xử lý cảnh báo", inventoryAlertService.resolve(id)));
    }
}
