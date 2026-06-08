package com.smartmart.controller;

import com.smartmart.common.response.ApiResponse;
import com.smartmart.dto.response.InventoryResponse;
import com.smartmart.entity.CurrentInventory;
import com.smartmart.mapper.WmsResponseMapper;
import com.smartmart.service.CurrentInventoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/current-inventories")
@Tag(name = "Current Inventory", description = "Quản lý dữ liệu tồn kho hiện tại")
@SecurityRequirement(name = "bearerAuth")
@RequiredArgsConstructor
public class CurrentInventoryController {

    private final CurrentInventoryService currentInventoryService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','WAREHOUSE')")
    @Operation(summary = "Xem toàn bộ tồn kho")
    public ResponseEntity<ApiResponse<List<InventoryResponse>>> listAll(
            @RequestParam(required = false) Long itemId,
            @RequestParam(required = false) Long locationId,
            @RequestParam(required = false) Long lotId) {
        List<CurrentInventory> list = currentInventoryService.listAll(itemId, locationId, lotId);
        List<InventoryResponse> content = WmsResponseMapper.toInventoryResponses(list);
        return ResponseEntity.ok(ApiResponse.success(content));
    }
}
