package com.smartmart.controller;

import com.smartmart.common.response.ApiResponse;
import com.smartmart.dto.request.CreateScrapOrderRequest;
import com.smartmart.entity.ScrapOrder;
import com.smartmart.service.ScrapOrderService;
import io.swagger.v3.oas.annotations.Operation;
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
public class ScrapOrderController {

    private final ScrapOrderService scrapOrderService;

    public ScrapOrderController(ScrapOrderService scrapOrderService) {
        this.scrapOrderService = scrapOrderService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','WAREHOUSE')")
    @Operation(summary = "Danh sách phiếu hủy")
    public ResponseEntity<ApiResponse<List<ScrapOrder>>> list() {
        return ResponseEntity.ok(ApiResponse.success(scrapOrderService.listAll()));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','WAREHOUSE')")
    @Operation(summary = "Tạo phiếu hủy (nháp)")
    public ResponseEntity<ApiResponse<ScrapOrder>> create(@Valid @RequestBody CreateScrapOrderRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo phiếu hủy thành công", scrapOrderService.create(request)));
    }

    @PostMapping("/{id}/complete")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','WAREHOUSE')")
    @Operation(summary = "Hoàn tất phiếu hủy — trừ tồn qua ledger")
    public ResponseEntity<ApiResponse<ScrapOrder>> complete(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Hoàn tất hủy hàng",
                scrapOrderService.complete(scrapOrderService.findById(id))));
    }
}
