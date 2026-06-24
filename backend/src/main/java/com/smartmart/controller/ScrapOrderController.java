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

import com.smartmart.enums.ScrapStatus;
import com.smartmart.entity.ScrapOrder;
import java.util.Collections;
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
    public ResponseEntity<ApiResponse<List<ScrapOrderResponse>>> list(
            @RequestParam(required = false) ScrapStatus status) {
        List<ScrapOrder> orders = scrapOrderService.listAll();
        if (status != null) {
            orders = orders.stream().filter(o -> o.getStatus() == status).toList();
        }
        List<ScrapOrderResponse> responses = WmsResponseMapper.toScrapOrderResponses(orders);
        scrapOrderService.enrichUsernames(responses);
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','WAREHOUSE')")
    @Operation(summary = "Chi tiết phiếu hủy")
    public ResponseEntity<ApiResponse<ScrapOrderResponse>> getById(@PathVariable Long id) {
        ScrapOrder order = scrapOrderService.findById(id);
        ScrapOrderResponse response = WmsResponseMapper.toScrapOrderResponse(order);
        scrapOrderService.enrichUsernames(Collections.singletonList(response));
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','WAREHOUSE')")
    @Operation(summary = "Tạo phiếu hủy (chờ duyệt)")
    public ResponseEntity<ApiResponse<ScrapOrderResponse>> create(@Valid @RequestBody CreateScrapOrderRequest request) {
        ScrapOrderResponse resp = WmsResponseMapper.toScrapOrderResponse(scrapOrderService.create(request));
        scrapOrderService.enrichUsernames(Collections.singletonList(resp));
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo phiếu hủy thành công", resp));
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    @Operation(summary = "Duyệt phiếu hủy — trừ tồn kho")
    public ResponseEntity<ApiResponse<ScrapOrderResponse>> approve(@PathVariable Long id) {
        ScrapOrderResponse resp = WmsResponseMapper.toScrapOrderResponse(scrapOrderService.approve(id));
        scrapOrderService.enrichUsernames(Collections.singletonList(resp));
        return ResponseEntity.ok(ApiResponse.success("Duyệt phiếu hủy thành công", resp));
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    @Operation(summary = "Từ chối phiếu hủy")
    public ResponseEntity<ApiResponse<ScrapOrderResponse>> cancel(
            @PathVariable Long id,
            @RequestParam String reason) {
        ScrapOrderResponse resp = WmsResponseMapper.toScrapOrderResponse(scrapOrderService.cancel(id, reason));
        scrapOrderService.enrichUsernames(Collections.singletonList(resp));
        return ResponseEntity.ok(ApiResponse.success("Từ chối phiếu hủy thành công", resp));
    }

}

            