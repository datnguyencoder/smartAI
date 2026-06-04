package com.smartmart.controller;

import com.smartmart.common.response.ApiResponse;
import com.smartmart.dto.response.InventoryLogResponse;
import com.smartmart.dto.response.InventoryResponse;
import com.smartmart.mapper.WmsResponseMapper;
import com.smartmart.service.InventoryQueryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/inventory")
@Tag(name = "Inventory", description = "Tồn kho WMS")
@SecurityRequirement(name = "bearerAuth")
public class InventoryController {

    private final InventoryQueryService inventoryQueryService;

    public InventoryController(InventoryQueryService inventoryQueryService) {
        this.inventoryQueryService = inventoryQueryService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','WAREHOUSE')")
    @Operation(summary = "Tồn kho hiện tại")
    public ResponseEntity<ApiResponse<List<InventoryResponse>>> list() {
        return ResponseEntity.ok(ApiResponse.success(
                WmsResponseMapper.toInventoryResponses(inventoryQueryService.listAll())));
    }

    @GetMapping("/low-stock")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','WAREHOUSE')")
    @Operation(summary = "Sản phẩm sắp hết hàng")
    public ResponseEntity<ApiResponse<List<InventoryResponse>>> lowStock() {
        return ResponseEntity.ok(ApiResponse.success(
                WmsResponseMapper.toInventoryResponses(inventoryQueryService.lowStock())));
    }

    @GetMapping("/near-expiry")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','WAREHOUSE')")
    @Operation(summary = "Sản phẩm cận hạn")
    public ResponseEntity<ApiResponse<List<InventoryResponse>>> nearExpiry() {
        return ResponseEntity.ok(ApiResponse.success(
                WmsResponseMapper.toInventoryResponses(inventoryQueryService.nearExpiry())));
    }

    @GetMapping("/logs")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','WAREHOUSE')")
    @Operation(summary = "Nhật ký biến động kho")
    public ResponseEntity<ApiResponse<Page<InventoryLogResponse>>> logs(
            @RequestParam(required = false) Long itemId,
            Pageable pageable
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                WmsResponseMapper.toInventoryLogPage(inventoryQueryService.logs(itemId, pageable))));
    }
}
