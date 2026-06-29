package com.smartmart.controller;

import com.smartmart.common.response.ApiResponse;
import com.smartmart.dto.request.CreateBrandRequest;
import com.smartmart.dto.request.UpdateBrandRequest;
import com.smartmart.dto.response.BrandResponse;
import com.smartmart.service.BrandService;
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
@RequestMapping("/api/v1/brands")
@Tag(name = "Brands", description = "Thương hiệu sản phẩm")
@SecurityRequirement(name = "bearerAuth")
public class BrandController {

    private final BrandService brandService;

    public BrandController(BrandService brandService) {
        this.brandService = brandService;
    }

    @GetMapping
    @Operation(summary = "Danh sách thương hiệu")
    public ResponseEntity<ApiResponse<List<BrandResponse>>> list() {
        return ResponseEntity.ok(ApiResponse.success(brandService.listAll()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Chi tiết thương hiệu")
    public ResponseEntity<ApiResponse<BrandResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(brandService.getById(id)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','WAREHOUSE')")
    @Operation(summary = "Tạo thương hiệu")
    public ResponseEntity<ApiResponse<BrandResponse>> create(@Valid @RequestBody CreateBrandRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo thương hiệu thành công", brandService.create(request)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','WAREHOUSE')")
    @Operation(summary = "Cập nhật thương hiệu")
    public ResponseEntity<ApiResponse<BrandResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody UpdateBrandRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thành công", brandService.update(id, request)));
    }
}
