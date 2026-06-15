package com.smartmart.controller;

import com.smartmart.common.response.ApiResponse;
import com.smartmart.dto.request.CloseShiftRequest;
import com.smartmart.dto.request.OpenShiftRequest;
import com.smartmart.dto.response.ShiftResponse;
import com.smartmart.entity.Shift;
import com.smartmart.mapper.WmsResponseMapper;
import com.smartmart.repository.UserRepository;
import com.smartmart.service.ShiftService;
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
@RequestMapping("/api/v1/shifts")
@Tag(name = "Shift", description = "Quản lý ca làm việc")
@SecurityRequirement(name = "bearerAuth")
public class ShiftController {

    private final ShiftService shiftService;
    private final UserRepository userRepository;

    public ShiftController(ShiftService shiftService, UserRepository userRepository) {
        this.shiftService = shiftService;
        this.userRepository = userRepository;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    @Operation(summary = "Danh sách ca làm việc")
    public ResponseEntity<ApiResponse<List<ShiftResponse>>> list() {
        return ResponseEntity.ok(ApiResponse.success(
                shiftService.listAll().stream().map(this::toResponse).toList()));
    }

    @GetMapping("/current")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    @Operation(summary = "Ca làm việc đang mở của user hiện tại")
    public ResponseEntity<ApiResponse<ShiftResponse>> current() {
        return shiftService.getOpenShiftForCurrentUser()
                .map(s -> ResponseEntity.ok(ApiResponse.success(toResponse(s))))
                .orElse(ResponseEntity.ok(ApiResponse.success("Không có ca đang mở", null)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    @Operation(summary = "Chi tiết ca làm việc")
    public ResponseEntity<ApiResponse<ShiftResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(toResponse(shiftService.findById(id))));
    }

    @PostMapping("/open")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    @Operation(summary = "Mở ca làm việc")
    public ResponseEntity<ApiResponse<ShiftResponse>> open(@Valid @RequestBody OpenShiftRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Mở ca thành công",
                        toResponse(shiftService.openShift(request))));
    }

    @PostMapping("/{id}/close")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    @Operation(summary = "Đóng ca làm việc")
    public ResponseEntity<ApiResponse<ShiftResponse>> close(
            @PathVariable Long id,
            @Valid @RequestBody CloseShiftRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success("Đóng ca thành công",
                toResponse(shiftService.closeShift(id, request))));
    }

    private ShiftResponse toResponse(Shift shift) {
        String cashierName = userRepository.findById(shift.getCashierId())
                .map(u -> u.getFullName() != null ? u.getFullName() : u.getUsername())
                .orElse("N/A");
        return WmsResponseMapper.toShiftResponse(shift, cashierName);
    }
}
