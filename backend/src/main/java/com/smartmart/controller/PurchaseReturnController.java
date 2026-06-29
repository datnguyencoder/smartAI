package com.smartmart.controller;

import com.smartmart.common.response.ApiResponse;
import com.smartmart.dto.request.CreatePurchaseReturnRequest;
import com.smartmart.dto.response.PurchaseReturnResponse;
import com.smartmart.service.PurchaseReturnService;
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
@RequestMapping("/api/v1/purchase-returns")
@Tag(name = "Purchase Return", description = "Trả hàng nhà cung cấp")
@SecurityRequirement(name = "bearerAuth")
public class PurchaseReturnController {

    private final PurchaseReturnService purchaseReturnService;

    public PurchaseReturnController(PurchaseReturnService purchaseReturnService) {
        this.purchaseReturnService = purchaseReturnService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','WAREHOUSE')")
    @Operation(summary = "Tạo phiếu trả hàng NCC")
    public ResponseEntity<ApiResponse<PurchaseReturnResponse>> create(
            @Valid @RequestBody CreatePurchaseReturnRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo phiếu trả hàng thành công", purchaseReturnService.create(request)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','WAREHOUSE')")
    @Operation(summary = "Chi tiết phiếu trả hàng")
    public ResponseEntity<ApiResponse<PurchaseReturnResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(purchaseReturnService.getById(id)));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','WAREHOUSE')")
    @Operation(summary = "Danh sách phiếu trả hàng")
    public ResponseEntity<ApiResponse<List<PurchaseReturnResponse>>> list() {
        return ResponseEntity.ok(ApiResponse.success(purchaseReturnService.listAll()));
    }
}
