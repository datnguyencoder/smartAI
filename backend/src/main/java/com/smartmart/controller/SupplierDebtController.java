package com.smartmart.controller;

import com.smartmart.common.response.ApiResponse;
import com.smartmart.dto.request.CreateDebtPaymentRequest;
import com.smartmart.dto.response.SupplierDebtResponse;
import com.smartmart.enums.SupplierDebtStatus;
import com.smartmart.mapper.WmsResponseMapper;
import com.smartmart.service.SupplierDebtService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/supplier-debts")
@Tag(name = "Supplier Debt", description = "Công nợ nhà cung cấp")
@SecurityRequirement(name = "bearerAuth")
public class SupplierDebtController {

    private final SupplierDebtService supplierDebtService;

    public SupplierDebtController(SupplierDebtService supplierDebtService) {
        this.supplierDebtService = supplierDebtService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    @Operation(summary = "Danh sách công nợ")
    public ResponseEntity<ApiResponse<List<SupplierDebtResponse>>> list(
            @RequestParam(required = false) SupplierDebtStatus status
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                WmsResponseMapper.toSupplierDebtResponses(supplierDebtService.listAll(status))));
    }

    @GetMapping("/supplier/{supplierId}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    @Operation(summary = "Công nợ theo nhà cung cấp")
    public ResponseEntity<ApiResponse<List<SupplierDebtResponse>>> listBySupplier(@PathVariable Long supplierId) {
        return ResponseEntity.ok(ApiResponse.success(
                WmsResponseMapper.toSupplierDebtResponses(supplierDebtService.listBySupplier(supplierId))));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    @Operation(summary = "Chi tiết công nợ")
    public ResponseEntity<ApiResponse<SupplierDebtResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(
                WmsResponseMapper.toSupplierDebtResponse(supplierDebtService.findById(id))));
    }

    @PostMapping("/{id}/payments")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    @Operation(summary = "Ghi nhận thanh toán công nợ")
    public ResponseEntity<ApiResponse<SupplierDebtResponse>> recordPayment(
            @PathVariable Long id,
            @Valid @RequestBody CreateDebtPaymentRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success("Ghi nhận thanh toán thành công",
                WmsResponseMapper.toSupplierDebtResponse(supplierDebtService.recordPayment(id, request))));
    }

    @PostMapping("/from-purchase/{purchaseOrderId}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    @Operation(summary = "Tạo công nợ từ phiếu nhập")
    public ResponseEntity<ApiResponse<SupplierDebtResponse>> createFromPurchase(
            @PathVariable Long purchaseOrderId,
            @RequestParam(required = false) LocalDate dueDate
    ) {
        return ResponseEntity.ok(ApiResponse.success("Tạo công nợ thành công",
                WmsResponseMapper.toSupplierDebtResponse(
                        supplierDebtService.createFromPurchaseOrder(purchaseOrderId, dueDate))));
    }
}
