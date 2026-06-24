package com.smartmart.controller;

import com.smartmart.common.response.ApiResponse;
import com.smartmart.dto.request.ConfirmStocktakeRequest;
import com.smartmart.dto.request.CreateStocktakeRequest;
import com.smartmart.dto.response.StocktakeResponse;
import com.smartmart.enums.StocktakeStatus;
import com.smartmart.mapper.WmsResponseMapper;
import com.smartmart.service.StocktakeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;

@RestController
@RequestMapping("/api/v1/stocktakes")
@Tag(name = "Stocktake", description = "Kiểm kê kho")
@SecurityRequirement(name = "bearerAuth")
public class StocktakeController {

    private final StocktakeService stocktakeService;

    public StocktakeController(StocktakeService stocktakeService) {
        this.stocktakeService = stocktakeService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','WAREHOUSE')")
    @Operation(summary = "Danh sách phiếu kiểm kê")
    public ResponseEntity<ApiResponse<List<StocktakeResponse>>> list(
            @RequestParam(required = false) StocktakeStatus status
    ) {
        List<StocktakeResponse> responses = WmsResponseMapper.toStocktakeResponses(stocktakeService.listAll(status));
        stocktakeService.enrichUsernames(responses);
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','WAREHOUSE')")
    @Operation(summary = "Chi tiết phiếu kiểm kê")
    public ResponseEntity<ApiResponse<StocktakeResponse>> getById(@PathVariable Long id) {
        StocktakeResponse resp = WmsResponseMapper.toStocktakeResponse(stocktakeService.findById(id));
        stocktakeService.enrichUsernames(Collections.singletonList(resp));
        return ResponseEntity.ok(ApiResponse.success(resp));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','WAREHOUSE')")
    @Operation(summary = "Tạo phiếu kiểm kê")
    public ResponseEntity<ApiResponse<StocktakeResponse>> create(@Valid @RequestBody CreateStocktakeRequest request) {
        StocktakeResponse resp = WmsResponseMapper.toStocktakeResponse(stocktakeService.create(request));
        stocktakeService.enrichUsernames(Collections.singletonList(resp));
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo phiếu kiểm kê thành công", resp));
    }

    @PostMapping("/{id}/confirm")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    @Operation(summary = "Xác nhận phiếu kiểm kê — điều chỉnh tồn kho")
    public ResponseEntity<ApiResponse<StocktakeResponse>> confirm(
            @PathVariable Long id,
            @RequestBody(required = false) ConfirmStocktakeRequest request
    ) {
        StocktakeResponse resp = WmsResponseMapper.toStocktakeResponse(
                        request != null ? stocktakeService.confirm(id, request) : stocktakeService.confirm(id));
        stocktakeService.enrichUsernames(Collections.singletonList(resp));
        return ResponseEntity.ok(ApiResponse.success("Xác nhận kiểm kê thành công", resp));
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    @Operation(summary = "Hủy phiếu kiểm kê")
    public ResponseEntity<ApiResponse<StocktakeResponse>> cancel(@PathVariable Long id) {
        StocktakeResponse resp = WmsResponseMapper.toStocktakeResponse(stocktakeService.cancel(id));
        stocktakeService.enrichUsernames(Collections.singletonList(resp));
        return ResponseEntity.ok(ApiResponse.success("Hủy phiếu kiểm kê thành công", resp));
    }
}
