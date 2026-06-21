package com.smartmart.controller;

import com.smartmart.common.response.ApiResponse;
import com.smartmart.dto.response.InventoryLogResponse;
import com.smartmart.dto.response.InventoryResponse;
import com.smartmart.enums.InventoryActionType;
import com.smartmart.mapper.WmsResponseMapper;
import com.smartmart.service.InventoryQueryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

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

    @GetMapping("/summary")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','WAREHOUSE')")
    @Operation(summary = "Tóm tắt tồn kho")
    public ResponseEntity<ApiResponse<Map<String, Object>>> summary() {
        return ResponseEntity.ok(ApiResponse.success(inventoryQueryService.summary()));
    }

    @GetMapping("/out-of-stock")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','WAREHOUSE')")
    @Operation(summary = "Sản phẩm hết tồn khả dụng")
    public ResponseEntity<ApiResponse<List<InventoryResponse>>> outOfStock() {
        return ResponseEntity.ok(ApiResponse.success(
                WmsResponseMapper.toInventoryResponses(inventoryQueryService.outOfStock())));
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
                inventoryQueryService.nearExpiryWithRisk()));
    }

    @GetMapping("/logs")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','WAREHOUSE')")
    @Operation(summary = "Nhật ký biến động kho")
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<Page<InventoryLogResponse>>> logs(
            @RequestParam(required = false) Long itemId,
            @RequestParam(required = false) Long locationId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) InventoryActionType actionType,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @org.springframework.data.web.PageableDefault(sort = "id", direction = org.springframework.data.domain.Sort.Direction.DESC) Pageable pageable
    ) {
        LocalDateTime from = fromDate != null ? fromDate.atStartOfDay() : null;
        LocalDateTime to = toDate != null ? toDate.plusDays(1).atStartOfDay() : null;

        return ResponseEntity.ok(ApiResponse.success(
                WmsResponseMapper.toInventoryLogPage(
                        inventoryQueryService.logs(itemId, locationId, search, actionType, from, to, pageable))));
    }
}
