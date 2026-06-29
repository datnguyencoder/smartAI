package com.smartmart.controller;

import com.smartmart.common.response.ApiResponse;
import com.smartmart.dto.request.CreateDebtPaymentRequest;
import com.smartmart.dto.response.CustomerDebtResponse;
import com.smartmart.enums.CustomerDebtStatus;
import com.smartmart.service.CustomerDebtService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/customer-debts")
@Tag(name = "Customer Debt", description = "Công nợ khách hàng")
@SecurityRequirement(name = "bearerAuth")
public class CustomerDebtController {
    private final CustomerDebtService customerDebtService;

    public CustomerDebtController(CustomerDebtService customerDebtService) {
        this.customerDebtService = customerDebtService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    @Operation(summary = "Danh sách công nợ khách")
    public ResponseEntity<ApiResponse<List<CustomerDebtResponse>>> list(@RequestParam(required = false) CustomerDebtStatus status) {
        return ResponseEntity.ok(ApiResponse.success(customerDebtService.listAll(status)));
    }

    @GetMapping("/customer/{customerId}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    @Operation(summary = "Công nợ theo khách hàng")
    public ResponseEntity<ApiResponse<List<CustomerDebtResponse>>> listByCustomer(@PathVariable Long customerId) {
        return ResponseEntity.ok(ApiResponse.success(customerDebtService.listByCustomer(customerId)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    @Operation(summary = "Chi tiết công nợ khách")
    public ResponseEntity<ApiResponse<CustomerDebtResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(customerDebtService.getById(id)));
    }

    @PostMapping("/{id}/payments")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    @Operation(summary = "Thu tiền công nợ khách")
    public ResponseEntity<ApiResponse<CustomerDebtResponse>> recordPayment(
            @PathVariable Long id,
            @Valid @RequestBody CreateDebtPaymentRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Ghi nhận thu tiền thành công",
                customerDebtService.recordPayment(id, request)));
    }
}
