package com.smartmart.controller;

import com.smartmart.common.response.ApiResponse;
import com.smartmart.dto.request.CreateItemRequest;
import com.smartmart.dto.response.ItemResponse;
import com.smartmart.service.ItemService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
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
    public ResponseEntity<ApiResponse<List<ItemResponse>>> list(@RequestParam(required = false) String q) {
        return ResponseEntity.ok(ApiResponse.success(itemService.listAll(q)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Chi tiết sản phẩm")
    public ResponseEntity<ApiResponse<ItemResponse>> get(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(itemService.getById(id)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','WAREHOUSE')")
    @Operation(summary = "Tạo sản phẩm")
    public ResponseEntity<ApiResponse<ItemResponse>> create(@Valid @RequestBody CreateItemRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo sản phẩm thành công", itemService.create(request)));
    }
}
