package com.smartmart.controller;

import com.smartmart.common.response.ApiResponse;
import com.smartmart.dto.request.CreateOnlineOrderRequestRequest;
import com.smartmart.dto.request.UpdateOnlineOrderRequestStatusRequest;
import com.smartmart.dto.response.OnlineOrderRequestResponse;
import com.smartmart.service.OnlineOrderRequestService;
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
@RequestMapping("/api/v1/online-orders")
@Tag(name = "Online Orders", description = "Yêu cầu đặt hàng online (stub)")
@SecurityRequirement(name = "bearerAuth")
public class OnlineOrderRequestController {

    private final OnlineOrderRequestService onlineOrderRequestService;

    public OnlineOrderRequestController(OnlineOrderRequestService onlineOrderRequestService) {
        this.onlineOrderRequestService = onlineOrderRequestService;
    }

    @PostMapping
    @Operation(summary = "Tạo yêu cầu đặt hàng online")
    public ResponseEntity<ApiResponse<OnlineOrderRequestResponse>> create(
            @Valid @RequestBody CreateOnlineOrderRequestRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo yêu cầu thành công", onlineOrderRequestService.create(request)));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    @Operation(summary = "Danh sách yêu cầu đặt hàng online")
    public ResponseEntity<ApiResponse<List<OnlineOrderRequestResponse>>> list() {
        return ResponseEntity.ok(ApiResponse.success(onlineOrderRequestService.listAll()));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    @Operation(summary = "Chi tiết yêu cầu")
    public ResponseEntity<ApiResponse<OnlineOrderRequestResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(onlineOrderRequestService.getById(id)));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    @Operation(summary = "Cập nhật trạng thái yêu cầu")
    public ResponseEntity<ApiResponse<OnlineOrderRequestResponse>> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateOnlineOrderRequestStatusRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Cập nhật trạng thái thành công",
                onlineOrderRequestService.updateStatus(id, request)));
    }
}
