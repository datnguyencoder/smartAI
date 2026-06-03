package com.smartmart.controller;

import com.smartmart.common.response.ApiResponse;
import com.smartmart.dto.request.CreateOrderRequest;
import com.smartmart.dto.response.OrderResponse;
import com.smartmart.service.OrderService;
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
@RequestMapping("/api/v1/orders")
@Tag(name = "Orders", description = "Bán hàng POS")
@SecurityRequirement(name = "bearerAuth")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    @Operation(summary = "Tạo hóa đơn bán (POS)")
    public ResponseEntity<ApiResponse<OrderResponse>> create(@Valid @RequestBody CreateOrderRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo hóa đơn thành công", orderService.create(request)));
    }

    @GetMapping
    @Operation(summary = "Danh sách hóa đơn")
    public ResponseEntity<ApiResponse<List<OrderResponse>>> list() {
        return ResponseEntity.ok(ApiResponse.success(orderService.listAll()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Chi tiết hóa đơn")
    public ResponseEntity<ApiResponse<OrderResponse>> get(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(orderService.getById(id)));
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    @Operation(summary = "Hủy hóa đơn")
    public ResponseEntity<ApiResponse<OrderResponse>> cancel(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Hủy hóa đơn thành công", orderService.cancel(id)));
    }
}
