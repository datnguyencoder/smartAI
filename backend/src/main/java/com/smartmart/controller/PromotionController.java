package com.smartmart.controller;

import com.smartmart.common.response.ApiResponse;
import com.smartmart.dto.request.CreatePromotionRequest;
import com.smartmart.dto.request.UpdatePromotionRequest;
import com.smartmart.dto.request.ValidatePromotionRequest;
import com.smartmart.dto.response.PromotionResponse;
import com.smartmart.dto.response.PromotionValidateResponse;
import com.smartmart.service.PromotionService;
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
@RequestMapping("/api/v1/promotions")
@Tag(name = "Promotions", description = "Quản lý khuyến mãi")
@SecurityRequirement(name = "bearerAuth")
public class PromotionController {

    private final PromotionService promotionService;

    public PromotionController(PromotionService promotionService) {
        this.promotionService = promotionService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    @Operation(summary = "Danh sách khuyến mãi")
    public ResponseEntity<ApiResponse<List<PromotionResponse>>> list(
            @RequestParam(required = false, defaultValue = "false") boolean activeOnly
    ) {
        List<PromotionResponse> data = activeOnly ? promotionService.listActive() : promotionService.listAll();
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    @Operation(summary = "Chi tiết khuyến mãi")
    public ResponseEntity<ApiResponse<PromotionResponse>> get(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(promotionService.getById(id)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    @Operation(summary = "Tạo khuyến mãi")
    public ResponseEntity<ApiResponse<PromotionResponse>> create(@Valid @RequestBody CreatePromotionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo khuyến mãi thành công", promotionService.create(request)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    @Operation(summary = "Cập nhật khuyến mãi")
    public ResponseEntity<ApiResponse<PromotionResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody UpdatePromotionRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thành công", promotionService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    @Operation(summary = "Xóa khuyến mãi")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        promotionService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa khuyến mãi thành công", null));
    }

    @PostMapping("/validate")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    @Operation(summary = "Kiểm tra mã khuyến mãi")
    public ResponseEntity<ApiResponse<PromotionValidateResponse>> validate(
            @Valid @RequestBody ValidatePromotionRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                promotionService.validateCode(request.getCode(), request.getOrderSubtotal(), request.getCustomerId())));
    }
}
