package com.smartmart.controller;

import com.smartmart.common.response.ApiResponse;
import com.smartmart.dto.request.CreateUomRequest;
import com.smartmart.dto.response.UomResponse;
import com.smartmart.service.UomService;
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
@RequestMapping("/api/v1/uoms")
@Tag(name = "UOMs", description = "Đơn vị tính")
@SecurityRequirement(name = "bearerAuth")
public class UomController {

    private final UomService uomService;

    public UomController(UomService uomService) {
        this.uomService = uomService;
    }

    @GetMapping
    @Operation(summary = "Danh sách UOM")
    public ResponseEntity<ApiResponse<List<UomResponse>>> list() {
        return ResponseEntity.ok(ApiResponse.success(uomService.listAll()));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    @Operation(summary = "Tạo UOM")
    public ResponseEntity<ApiResponse<UomResponse>> create(@Valid @RequestBody CreateUomRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo UOM thành công", uomService.create(request)));
    }
}
