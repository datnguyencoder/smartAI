package com.smartmart.controller;

import com.smartmart.common.response.ApiResponse;
import com.smartmart.dto.request.CreateSupplierItemRequest;
import com.smartmart.dto.request.UpdateSupplierItemRequest;
import com.smartmart.dto.response.ItemResponse;
import com.smartmart.dto.response.SupplierItemResponse;
import com.smartmart.service.SupplierItemService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/supplier-items")
@Tag(name = "Supplier Items", description = "Quản lý sản phẩm cho nhà cung cấp")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
public class SupplierItemController {
    private final SupplierItemService supplierItemService;
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<SupplierItemResponse>> create(
            @Valid @RequestBody CreateSupplierItemRequest request
    ) {
        SupplierItemResponse response = supplierItemService.create(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo sản phẩm cho nhà cung cấp thành công", response));
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<SupplierItemResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody UpdateSupplierItemRequest request
    ) {
        SupplierItemResponse response = supplierItemService.update(id, request);
        return ResponseEntity.ok(
                ApiResponse.success("Cập nhật sản phẩm của nhà cung cấp thành công", response)
        );
    }

    @PatchMapping("/{id}/deactivate")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<Void>> deactivate(@PathVariable Long id) {
        supplierItemService.deactivate(id);
        return ResponseEntity.ok(
                ApiResponse.success("Ngừng cung cấp sản phẩm thành công", null)
        );
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','WAREHOUSE')")
    public ResponseEntity<ApiResponse<List<SupplierItemResponse>>> listBySupplier(
            @RequestParam Long supplierId
    ) {
        return ResponseEntity.ok(
                ApiResponse.success(supplierItemService.listBySupplier(supplierId))
        );
    }

    @PatchMapping("/{id}/activate")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<Void>> activate(@PathVariable Long id) {
        supplierItemService.activate(id);
        return ResponseEntity.ok(
                ApiResponse.success("Mở cung cấp sản phẩm thành công", null)
        );
    }
}
