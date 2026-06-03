package com.smartmart.controller;

import com.smartmart.common.response.ApiResponse;
import com.smartmart.dto.request.CreatePurchaseOrderRequest;
import com.smartmart.dto.request.ReceivePurchaseRequest;
import com.smartmart.dto.response.PurchaseOrderResponse;
import com.smartmart.service.PurchaseOrderService;
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
@RequestMapping("/api/v1/purchase-orders")
@Tag(name = "Purchase", description = "Phiếu nhập kho")
@SecurityRequirement(name = "bearerAuth")
public class PurchaseOrderController {

    private final PurchaseOrderService purchaseOrderService;

    public PurchaseOrderController(PurchaseOrderService purchaseOrderService) {
        this.purchaseOrderService = purchaseOrderService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','WAREHOUSE')")
    @Operation(summary = "Tạo phiếu nhập")
    public ResponseEntity<ApiResponse<PurchaseOrderResponse>> create(@Valid @RequestBody CreatePurchaseOrderRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo phiếu nhập thành công", purchaseOrderService.create(request)));
    }

    @PostMapping("/{id}/receive")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','WAREHOUSE')")
    @Operation(summary = "Nhận hàng vào kho")
    public ResponseEntity<ApiResponse<PurchaseOrderResponse>> receive(
            @PathVariable Long id,
            @Valid @RequestBody ReceivePurchaseRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success("Nhận hàng thành công", purchaseOrderService.receive(id, request)));
    }

    @GetMapping
    @Operation(summary = "Danh sách phiếu nhập")
    public ResponseEntity<ApiResponse<List<PurchaseOrderResponse>>> list() {
        return ResponseEntity.ok(ApiResponse.success(purchaseOrderService.listAll()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Chi tiết phiếu nhập")
    public ResponseEntity<ApiResponse<PurchaseOrderResponse>> get(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(purchaseOrderService.getById(id)));
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    @Operation(summary = "Hủy phiếu nhập chưa nhận hàng")
    public ResponseEntity<ApiResponse<PurchaseOrderResponse>> cancel(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Hủy phiếu nhập thành công", purchaseOrderService.cancel(id)));
    }
}
