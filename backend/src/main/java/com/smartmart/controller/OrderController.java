package com.smartmart.controller;

import com.smartmart.common.response.ApiResponse;
import com.smartmart.common.response.PageResponse;
import com.smartmart.dto.request.CreateOrderRequest;
import com.smartmart.dto.response.OrderPrintResponse;
import com.smartmart.dto.response.OrderResponse;
import com.smartmart.enums.OrderStatus;
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
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF','WAREHOUSE')")
    @Operation(summary = "Danh sách hóa đơn")
    public ResponseEntity<ApiResponse<List<OrderResponse>>> list(
            @RequestParam(required = false) String customerPhone
    ) {
        if (customerPhone != null && !customerPhone.isBlank()) {
            return ResponseEntity.ok(ApiResponse.success(orderService.listByCustomerPhone(customerPhone)));
        }
        return ResponseEntity.ok(ApiResponse.success(orderService.listAll()));
    }

    @GetMapping("/paged")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF','WAREHOUSE')")
    @Operation(summary = "Danh sách hóa đơn phân trang")
    public ResponseEntity<ApiResponse<PageResponse<OrderResponse>>> listPaged(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) OrderStatus status,
            @RequestParam(required = false) java.time.LocalDateTime fromDate,
            @RequestParam(required = false) java.time.LocalDateTime toDate) {
        return ResponseEntity.ok(ApiResponse.success(PageResponse.of(
                orderService.listPaged(page, size, search, status, fromDate, toDate))));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF','WAREHOUSE')")
    @Operation(summary = "Chi tiết hóa đơn")
    public ResponseEntity<ApiResponse<OrderResponse>> get(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(orderService.getById(id)));
    }

    @GetMapping("/{id}/print")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    @Operation(summary = "Dữ liệu in hóa đơn POS")
    public ResponseEntity<ApiResponse<OrderPrintResponse>> print(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(orderService.getPrint(id)));
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    @Operation(summary = "Hủy hóa đơn")
    public ResponseEntity<ApiResponse<OrderResponse>> cancel(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Hủy hóa đơn thành công", orderService.cancel(id)));
    }

    @GetMapping("/customers/suggest")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    @Operation(summary = "Gợi ý tên khách hàng cũ cho POS")
    public ResponseEntity<ApiResponse<List<String>>> suggestCustomers(@RequestParam("q") String keyword) {
        return ResponseEntity.ok(ApiResponse.success(orderService.suggestCustomers(keyword)));
    }
}
