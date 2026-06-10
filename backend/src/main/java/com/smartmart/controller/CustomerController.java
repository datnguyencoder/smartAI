package com.smartmart.controller;

import com.smartmart.common.response.ApiResponse;
import com.smartmart.dto.request.CreateCustomerRequest;
import com.smartmart.dto.request.UpdateCustomerRequest;
import com.smartmart.dto.response.CustomerResponse;
import com.smartmart.service.CustomerService;
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
@RequestMapping("/api/v1/customers")
@Tag(name = "Customers", description = "Quản lý khách hàng & loyalty")
@SecurityRequirement(name = "bearerAuth")
public class CustomerController {

    private final CustomerService customerService;

    public CustomerController(CustomerService customerService) {
        this.customerService = customerService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    @Operation(summary = "Tìm khách hàng theo SĐT hoặc tên")
    public ResponseEntity<ApiResponse<List<CustomerResponse>>> search(
            @RequestParam(required = false) String phone,
            @RequestParam(required = false) String q
    ) {
        return ResponseEntity.ok(ApiResponse.success(customerService.search(phone, q)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    @Operation(summary = "Chi tiết khách hàng")
    public ResponseEntity<ApiResponse<CustomerResponse>> get(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(customerService.getById(id)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    @Operation(summary = "Tạo khách hàng mới")
    public ResponseEntity<ApiResponse<CustomerResponse>> create(@Valid @RequestBody CreateCustomerRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo khách hàng thành công", customerService.create(request)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    @Operation(summary = "Cập nhật khách hàng")
    public ResponseEntity<ApiResponse<CustomerResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody UpdateCustomerRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thành công", customerService.update(id, request)));
    }
}
