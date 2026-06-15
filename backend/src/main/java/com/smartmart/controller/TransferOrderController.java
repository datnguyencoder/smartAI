package com.smartmart.controller;

import com.smartmart.common.response.ApiResponse;
import com.smartmart.dto.request.CreateTransferOrderRequest;
import com.smartmart.dto.response.TransferOrderResponse;
import com.smartmart.enums.TransferStatus;
import com.smartmart.mapper.WmsResponseMapper;
import com.smartmart.service.TransferOrderService;
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
@RequestMapping("/api/v1/transfer-orders")
@Tag(name = "Transfer", description = "Chuyển kho")
@SecurityRequirement(name = "bearerAuth")
public class TransferOrderController {

    private final TransferOrderService transferOrderService;

    public TransferOrderController(TransferOrderService transferOrderService) {
        this.transferOrderService = transferOrderService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','WAREHOUSE')")
    @Operation(summary = "Danh sách phiếu chuyển kho")
    public ResponseEntity<ApiResponse<List<TransferOrderResponse>>> list(
            @RequestParam(required = false) TransferStatus status
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                WmsResponseMapper.toTransferOrderResponses(transferOrderService.listAll(status))));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','WAREHOUSE')")
    @Operation(summary = "Chi tiết phiếu chuyển kho")
    public ResponseEntity<ApiResponse<TransferOrderResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(
                WmsResponseMapper.toTransferOrderResponse(transferOrderService.findById(id))));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','WAREHOUSE')")
    @Operation(summary = "Tạo phiếu chuyển kho")
    public ResponseEntity<ApiResponse<TransferOrderResponse>> create(@Valid @RequestBody CreateTransferOrderRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo phiếu chuyển kho thành công",
                        WmsResponseMapper.toTransferOrderResponse(transferOrderService.create(request))));
    }

    @PostMapping("/{id}/complete")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','WAREHOUSE')")
    @Operation(summary = "Hoàn thành phiếu chuyển kho")
    public ResponseEntity<ApiResponse<TransferOrderResponse>> complete(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Chuyển kho thành công",
                WmsResponseMapper.toTransferOrderResponse(transferOrderService.complete(id))));
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    @Operation(summary = "Hủy phiếu chuyển kho")
    public ResponseEntity<ApiResponse<TransferOrderResponse>> cancel(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Hủy phiếu chuyển kho thành công",
                WmsResponseMapper.toTransferOrderResponse(transferOrderService.cancel(id))));
    }
}
