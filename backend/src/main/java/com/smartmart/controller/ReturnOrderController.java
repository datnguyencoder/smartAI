package com.smartmart.controller;

import com.smartmart.common.response.ApiResponse;
import com.smartmart.dto.request.CreateReturnOrderRequest;
import com.smartmart.dto.response.ReturnOrderResponse;
import com.smartmart.dto.response.ReturnableOrderItemResponse;
import com.smartmart.mapper.WmsResponseMapper;
import com.smartmart.service.ReturnOrderService;
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
@RequestMapping("/api/v1/return-orders")
@Tag(name = "Return", description = "Trả hàng")
@SecurityRequirement(name = "bearerAuth")
public class ReturnOrderController {

    private final ReturnOrderService returnOrderService;

    public ReturnOrderController(ReturnOrderService returnOrderService) {
        this.returnOrderService = returnOrderService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    @Operation(summary = "Danh sách phiếu trả hàng")
    public ResponseEntity<ApiResponse<List<ReturnOrderResponse>>> list() {
        return ResponseEntity.ok(ApiResponse.success(
                WmsResponseMapper.toReturnOrderResponses(returnOrderService.listAll())));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    @Operation(summary = "Chi tiết phiếu trả hàng")
    public ResponseEntity<ApiResponse<ReturnOrderResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(
                WmsResponseMapper.toReturnOrderResponse(returnOrderService.findById(id))));
    }

    @GetMapping("/by-order/{orderId}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    @Operation(summary = "Phiếu trả hàng theo hóa đơn gốc")
    public ResponseEntity<ApiResponse<List<ReturnOrderResponse>>> listByOrder(@PathVariable Long orderId) {
        return ResponseEntity.ok(ApiResponse.success(
                WmsResponseMapper.toReturnOrderResponses(returnOrderService.listByOriginalOrder(orderId))));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    @Operation(summary = "Tạo phiếu trả hàng")
    public ResponseEntity<ApiResponse<ReturnOrderResponse>> create(@Valid @RequestBody CreateReturnOrderRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo phiếu trả hàng thành công",
                        WmsResponseMapper.toReturnOrderResponse(returnOrderService.create(request))));
    }

    @GetMapping("/returnable-items/{orderId}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    @Operation(summary = "Danh sách sản phẩm còn được trả theo hóa đơn")
    public ResponseEntity<ApiResponse<List<ReturnableOrderItemResponse>>> listReturnableItems(@PathVariable Long orderId) {
        return ResponseEntity.ok(ApiResponse.success(returnOrderService.listReturnableItems(orderId)));
    }
}
