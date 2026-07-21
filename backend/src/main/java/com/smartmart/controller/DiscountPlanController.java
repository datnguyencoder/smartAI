package com.smartmart.controller;

import com.smartmart.common.response.ApiResponse;
import com.smartmart.dto.request.CreateDiscountPlanRequest;
import com.smartmart.dto.request.UpdateDiscountPlanRequest;
import com.smartmart.dto.response.DiscountApplyResponse;
import com.smartmart.dto.response.DiscountPlanResponse;
import com.smartmart.service.DiscountPlanService;
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
@RequestMapping("/api/v1/discount-plans")
@Tag(name = "Discount Plans", description = "Kế hoạch giảm giá")
@SecurityRequirement(name = "bearerAuth")
public class DiscountPlanController {

    private final DiscountPlanService discountPlanService;

    public DiscountPlanController(DiscountPlanService discountPlanService) {
        this.discountPlanService = discountPlanService;
    }

    // STAFF cần đọc danh sách này ở POS để tự tính giá BOGO/quà tặng khi bán hàng —
    // trước đây chỉ ADMIN/MANAGER được gọi nên POS của thu ngân (STAFF) luôn nhận 403,
    // lỗi bị nuốt âm thầm ở FE khiến toàn bộ khuyến mãi "biến mất" không rõ lý do.
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF','WAREHOUSE')")
    @Operation(summary = "Danh sách kế hoạch giảm giá")
    public ResponseEntity<ApiResponse<List<DiscountPlanResponse>>> list() {
        return ResponseEntity.ok(ApiResponse.success(discountPlanService.listAll()));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    @Operation(summary = "Chi tiết kế hoạch giảm giá")
    public ResponseEntity<ApiResponse<DiscountPlanResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(discountPlanService.getById(id)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    @Operation(summary = "Tạo kế hoạch giảm giá")
    public ResponseEntity<ApiResponse<DiscountPlanResponse>> create(
            @Valid @RequestBody CreateDiscountPlanRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo kế hoạch giảm giá thành công", discountPlanService.create(request)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    @Operation(summary = "Cập nhật kế hoạch giảm giá")
    public ResponseEntity<ApiResponse<DiscountPlanResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody UpdateDiscountPlanRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thành công", discountPlanService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    @Operation(summary = "Xoá chiến dịch khuyến mãi")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        discountPlanService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Đã xoá chiến dịch", null));
    }

    @GetMapping("/apply/{itemId}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF','WAREHOUSE')")
    @Operation(summary = "Áp dụng quy tắc giảm giá cho sản phẩm")
    public ResponseEntity<ApiResponse<DiscountApplyResponse>> apply(@PathVariable Long itemId) {
        return ResponseEntity.ok(ApiResponse.success(discountPlanService.applyForItem(itemId)));
    }
}
