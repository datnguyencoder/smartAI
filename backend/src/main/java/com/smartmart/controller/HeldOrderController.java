package com.smartmart.controller;

import com.smartmart.common.response.ApiResponse;
import com.smartmart.dto.request.CreateHeldOrderRequest;
import com.smartmart.dto.response.HeldOrderResponse;
import com.smartmart.service.HeldOrderService;
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
@RequestMapping("/api/v1/pos/holds")
@Tag(name = "POS Holds", description = "Đơn POS giữ tạm")
@SecurityRequirement(name = "bearerAuth")
public class HeldOrderController {

    private final HeldOrderService heldOrderService;

    public HeldOrderController(HeldOrderService heldOrderService) {
        this.heldOrderService = heldOrderService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    @Operation(summary = "Giữ đơn POS")
    public ResponseEntity<ApiResponse<HeldOrderResponse>> create(@Valid @RequestBody CreateHeldOrderRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Đã giữ đơn POS", heldOrderService.create(request)));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    @Operation(summary = "Danh sách đơn POS đang giữ")
    public ResponseEntity<ApiResponse<List<HeldOrderResponse>>> listActive() {
        return ResponseEntity.ok(ApiResponse.success(heldOrderService.listActive()));
    }

    @PostMapping("/{id}/restore")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    @Operation(summary = "Khôi phục đơn POS đang giữ")
    public ResponseEntity<ApiResponse<HeldOrderResponse>> restore(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Đã khôi phục đơn giữ", heldOrderService.restore(id)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    @Operation(summary = "Hủy đơn POS đang giữ")
    public ResponseEntity<ApiResponse<HeldOrderResponse>> cancel(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Đã hủy đơn giữ", heldOrderService.cancel(id)));
    }
}
