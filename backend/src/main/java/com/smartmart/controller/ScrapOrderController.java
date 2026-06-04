package com.smartmart.controller;

import com.smartmart.common.response.ApiResponse;
import com.smartmart.dto.request.CreateScrapOrderRequest;
import com.smartmart.dto.response.ScrapOrderResponse;
import com.smartmart.mapper.WmsResponseMapper;
import com.smartmart.service.ScrapOrderService;
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
@RequestMapping("/api/v1/scrap-orders")
@Tag(name = "Scrap", description = "Phiếu hủy hàng")
@SecurityRequirement(name = "bearerAuth")
public class ScrapOrderController {

    private final ScrapOrderService scrapOrderService;

    public ScrapOrderController(ScrapOrderService scrapOrderService) {
        this.scrapOrderService = scrapOrderService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','WAREHOUSE')")
    @Operation(summary = "Danh sách phiếu hủy")
    public ResponseEntity<ApiResponse<List<ScrapOrderResponse>>> list() {
        return ResponseEntity.ok(ApiResponse.success(
                WmsResponseMapper.toScrapOrderResponses(scrapOrderService.listAll())));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','WAREHOUSE')")
    @Operation(summary = "Tạo phiếu hủy (nháp)")
    public ResponseEntity<ApiResponse<ScrapOrderResponse>> create(@Valid @RequestBody CreateScrapOrderRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo phiếu hủy thành công",
                        WmsResponseMapper.toScrapOrderResponse(scrapOrderService.create(request))));
    }

    @PostMapping("/{id}/complete")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','WAREHOUSE')")
    @Operation(summary = "Hoàn tất phiếu hủy — trừ tồn qua ledger")
    public ResponseEntity<ApiResponse<ScrapOrderResponse>> complete(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Hoàn tất hủy hàng",
                WmsResponseMapper.toScrapOrderResponse(
                        scrapOrderService.complete(scrapOrderService.findById(id)))));
    }
}
