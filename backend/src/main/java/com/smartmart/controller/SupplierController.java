package com.smartmart.controller;

import com.smartmart.common.response.ApiResponse;
import com.smartmart.dto.request.CreateSupplierRequest;
import com.smartmart.dto.response.SupplierResponse;
import com.smartmart.service.SupplierService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/suppliers")
@Tag(name = "Suppliers", description = "Nhà cung cấp")
public class SupplierController {

    private final SupplierService supplierService;

    public SupplierController(SupplierService supplierService) {
        this.supplierService = supplierService;
    }

    @GetMapping
    @Operation(summary = "Danh sách nhà cung cấp")
    public ResponseEntity<ApiResponse<List<SupplierResponse>>> list() {
        return ResponseEntity.ok(ApiResponse.success(supplierService.listAll()));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    @Operation(summary = "Tạo nhà cung cấp")
    public ResponseEntity<ApiResponse<SupplierResponse>> create(@Valid @RequestBody CreateSupplierRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo NCC thành công", supplierService.create(request)));
    }
}
