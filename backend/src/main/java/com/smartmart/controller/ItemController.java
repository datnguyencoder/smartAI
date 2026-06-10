package com.smartmart.controller;

import com.smartmart.common.response.ApiResponse;
import com.smartmart.common.response.PageResponse;
import com.smartmart.dto.request.CreateItemRequest;
import com.smartmart.dto.request.UpdateItemRequest;
import com.smartmart.dto.response.ItemResponse;
import com.smartmart.service.ItemService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/items")
@Tag(name = "Items", description = "Sản phẩm (WMS)")
@SecurityRequirement(name = "bearerAuth")
public class ItemController {

    private final ItemService itemService;

    public ItemController(ItemService itemService) {
        this.itemService = itemService;
    }

    @GetMapping
    @Operation(summary = "Danh sách sản phẩm")
    public ResponseEntity<ApiResponse<?>> list(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String barcode,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Boolean active,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size
    ) {
        if (barcode != null && !barcode.isBlank()) {
            return ResponseEntity.ok(ApiResponse.success(itemService.getByBarcode(barcode.trim())));
        }
        if (page != null) {
            int pageSize = size != null && size > 0 ? Math.min(size, 200) : 50;
            Pageable pageable = org.springframework.data.domain.PageRequest.of(Math.max(page, 0), pageSize, org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "id"));
            PageResponse<ItemResponse> result = itemService.listPaged(q, categoryId, active, pageable);
            return ResponseEntity.ok(ApiResponse.success(result));
        }
        return ResponseEntity.ok(ApiResponse.success(itemService.listAll(q, categoryId, active)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Chi tiết sản phẩm")
    public ResponseEntity<ApiResponse<ItemResponse>> get(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(itemService.getById(id)));
    }

    @GetMapping("/{id}/uoms")
    @Operation(summary = "Danh sách đơn vị tính của sản phẩm (Base & Purchase)")
    public ResponseEntity<ApiResponse<List<com.smartmart.dto.response.UomResponse>>> getItemUoms(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(itemService.getItemUoms(id)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','WAREHOUSE')")
    @Operation(summary = "Tạo sản phẩm")
    public ResponseEntity<ApiResponse<ItemResponse>> create(@Valid @RequestBody CreateItemRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo sản phẩm thành công", itemService.create(request)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','WAREHOUSE')")
    @Operation(summary = "Cập nhật sản phẩm")
    public ResponseEntity<ApiResponse<ItemResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody UpdateItemRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success("Cập nhật sản phẩm thành công", itemService.update(id, request)));
    }
}
