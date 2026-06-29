package com.smartmart.controller;

import com.smartmart.common.response.ApiResponse;
import com.smartmart.dto.request.CreateQuotationRequest;
import com.smartmart.dto.response.OrderResponse;
import com.smartmart.dto.response.QuotationResponse;
import com.smartmart.service.QuotationService;
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
@RequestMapping("/api/v1/quotations")
@Tag(name = "Quotations", description = "Báo giá")
@SecurityRequirement(name = "bearerAuth")
public class QuotationController {

    private final QuotationService quotationService;

    public QuotationController(QuotationService quotationService) {
        this.quotationService = quotationService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','CASHIER')")
    @Operation(summary = "Tạo báo giá")
    public ResponseEntity<ApiResponse<QuotationResponse>> create(@Valid @RequestBody CreateQuotationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo báo giá thành công", quotationService.create(request)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','CASHIER')")
    @Operation(summary = "Chi tiết báo giá")
    public ResponseEntity<ApiResponse<QuotationResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(quotationService.getById(id)));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','CASHIER')")
    @Operation(summary = "Danh sách báo giá")
    public ResponseEntity<ApiResponse<List<QuotationResponse>>> list() {
        return ResponseEntity.ok(ApiResponse.success(quotationService.listAll()));
    }

    @PostMapping("/{id}/convert")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','CASHIER')")
    @Operation(summary = "Chuyển báo giá thành đơn hàng")
    public ResponseEntity<ApiResponse<OrderResponse>> convert(@PathVariable Long id) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Chuyển đổi thành công", quotationService.convertToOrder(id)));
    }
}
