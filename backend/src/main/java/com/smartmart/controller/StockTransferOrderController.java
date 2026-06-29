package com.smartmart.controller;

import com.smartmart.common.response.ApiResponse;
import com.smartmart.dto.request.CreateStockTransferOrderRequest;
import com.smartmart.dto.response.StockTransferOrderResponse;
import com.smartmart.service.StockTransferOrderService;
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
@RequestMapping("/api/v1/stock-transfers")
@Tag(name = "Stock Transfer", description = "Phiếu điều chuyển kho")
@SecurityRequirement(name = "bearerAuth")
public class StockTransferOrderController {

    private final StockTransferOrderService stockTransferOrderService;

    public StockTransferOrderController(StockTransferOrderService stockTransferOrderService) {
        this.stockTransferOrderService = stockTransferOrderService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','WAREHOUSE')")
    @Operation(summary = "Tạo phiếu điều chuyển (DRAFT)")
    public ResponseEntity<ApiResponse<StockTransferOrderResponse>> create(
            @Valid @RequestBody CreateStockTransferOrderRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo phiếu điều chuyển thành công",
                        stockTransferOrderService.create(request)));
    }

    @PostMapping("/{id}/confirm")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','WAREHOUSE')")
    @Operation(summary = "Xác nhận điều chuyển và ghi sổ kho")
    public ResponseEntity<ApiResponse<StockTransferOrderResponse>> confirm(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Xác nhận điều chuyển thành công",
                stockTransferOrderService.confirm(id)));
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','WAREHOUSE')")
    @Operation(summary = "Hủy phiếu điều chuyển")
    public ResponseEntity<ApiResponse<StockTransferOrderResponse>> cancel(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Hủy phiếu điều chuyển thành công",
                stockTransferOrderService.cancel(id)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','WAREHOUSE')")
    @Operation(summary = "Chi tiết phiếu điều chuyển")
    public ResponseEntity<ApiResponse<StockTransferOrderResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(stockTransferOrderService.getById(id)));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','WAREHOUSE')")
    @Operation(summary = "Danh sách phiếu điều chuyển")
    public ResponseEntity<ApiResponse<List<StockTransferOrderResponse>>> list() {
        return ResponseEntity.ok(ApiResponse.success(stockTransferOrderService.listAll()));
    }
}
