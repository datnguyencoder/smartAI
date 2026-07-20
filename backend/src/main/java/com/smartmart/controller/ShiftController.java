package com.smartmart.controller;

import com.smartmart.common.response.ApiResponse;
import com.smartmart.common.response.PageResponse;
import com.smartmart.dto.request.CloseShiftRequest;
import com.smartmart.dto.request.OpenShiftRequest;
import com.smartmart.dto.request.ReviewShiftRequest;
import com.smartmart.dto.request.PaymentMethodCorrectionRequest;
import com.smartmart.dto.request.ShiftNoteRequest;
import com.smartmart.dto.response.ShiftDashboardResponse;
import com.smartmart.dto.response.ShiftBillFlowResponse;
import com.smartmart.dto.response.ShiftMoneyFlowResponse;
import com.smartmart.dto.response.ShiftResponse;
import com.smartmart.dto.response.ShiftReturnedItemResponse;
import com.smartmart.dto.response.ShiftSummaryResponse;
import com.smartmart.dto.response.AuditLogResponse;
import com.smartmart.entity.Shift;
import com.smartmart.mapper.WmsResponseMapper;
import com.smartmart.repository.UserRepository;
import com.smartmart.service.ShiftService;
import com.smartmart.service.AuditLogService;
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
    private final AuditLogService auditLogService;

    public ShiftController(ShiftService shiftService, UserRepository userRepository, AuditLogService auditLogService) {
        this.shiftService = shiftService;
        this.userRepository = userRepository;
        this.auditLogService = auditLogService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
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

    @GetMapping("/dashboard")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    @Operation(summary = "Tổng quan tiền và thống kê ca làm việc")
    public ResponseEntity<ApiResponse<ShiftDashboardResponse>> dashboard() {
        return ResponseEntity.ok(ApiResponse.success(shiftService.getDashboard()));
    }

    @GetMapping("/returned-items")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    @Operation(summary = "Danh sách hàng trả theo ca được phép xem")
    public ResponseEntity<ApiResponse<List<ShiftReturnedItemResponse>>> returnedItems() {
        return ResponseEntity.ok(ApiResponse.success(shiftService.getReturnedItems()));
    }

    @GetMapping("/{id}/bill-flow")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    @Operation(summary = "Hóa đơn bán và trả hàng của ca")
    public ResponseEntity<ApiResponse<List<ShiftBillFlowResponse>>> billFlow(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(shiftService.getBillFlow(id)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    @Operation(summary = "Chi tiết ca làm việc")
    public ResponseEntity<ApiResponse<ShiftResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(toResponse(shiftService.findById(id))));
    }

    @GetMapping("/{id}/summary")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    @Operation(summary = "Báo cáo Z ca làm việc")
    public ResponseEntity<ApiResponse<ShiftSummaryResponse>> summary(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(shiftService.getSummary(id)));
    }

    @GetMapping("/{id}/money-flow")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    @Operation(summary = "Dòng tiền phát sinh trong ca")
    public ResponseEntity<ApiResponse<List<ShiftMoneyFlowResponse>>> moneyFlow(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(shiftService.getMoneyFlow(id)));
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

    @PostMapping("/{id}/review")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    @Operation(summary = "Duyệt đối soát ca lệch tiền")
    public ResponseEntity<ApiResponse<ShiftResponse>> review(
            @PathVariable Long id,
            @Valid @RequestBody ReviewShiftRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success("Duyệt đối soát ca thành công",
                toResponse(shiftService.reviewShift(id, request))));
    }

    @GetMapping("/{id}/activity")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    @Operation(summary = "Lịch sử và trao đổi chung của ca")
    public ResponseEntity<ApiResponse<PageResponse<AuditLogResponse>>> activity(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "100") int size
    ) {
        shiftService.findById(id);
        return ResponseEntity.ok(ApiResponse.success(
                auditLogService.listByEntity("SHIFT", id.toString(), page, Math.min(size, 100))));
    }

    @PostMapping("/{id}/request-staff-update")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    @Operation(summary = "Yêu cầu nhân viên bổ sung giải trình")
    public ResponseEntity<ApiResponse<ShiftResponse>> requestStaffUpdate(
            @PathVariable Long id, @Valid @RequestBody ShiftNoteRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Đã yêu cầu bổ sung giải trình",
                toResponse(shiftService.requestStaffUpdate(id, request.getNote()))));
    }

    @PostMapping("/{id}/staff-explanation")
    @PreAuthorize("hasAnyRole('STAFF','MANAGER','ADMIN')")
    @Operation(summary = "Nhân viên bổ sung giải trình")
    public ResponseEntity<ApiResponse<ShiftResponse>> staffExplanation(
            @PathVariable Long id, @Valid @RequestBody ShiftNoteRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Đã gửi lại giải trình",
                toResponse(shiftService.updateStaffExplanation(id, request.getNote()))));
    }

    @PostMapping("/{id}/manager-review")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    @Operation(summary = "Quản lý duyệt và gửi ca cho Admin")
    public ResponseEntity<ApiResponse<ShiftResponse>> managerReview(
            @PathVariable Long id, @Valid @RequestBody ShiftNoteRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Đã gửi ca cho Admin",
                toResponse(shiftService.submitManagerReview(id, request.getNote()))));
    }

    @PostMapping("/{id}/request-manager-update")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Admin yêu cầu quản lý kiểm tra lại")
    public ResponseEntity<ApiResponse<ShiftResponse>> requestManagerUpdate(
            @PathVariable Long id, @Valid @RequestBody ShiftNoteRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Đã trả ca cho quản lý",
                toResponse(shiftService.requestManagerUpdate(id, request.getNote()))));
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Admin phê duyệt ca")
    public ResponseEntity<ApiResponse<ShiftResponse>> approve(
            @PathVariable Long id, @Valid @RequestBody ShiftNoteRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Đã phê duyệt ca",
                toResponse(shiftService.approveShift(id, request.getNote()))));
    }

    @PostMapping("/{id}/payments/{paymentId}/method")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    @Operation(summary = "Sửa phương thức thanh toán với lý do bắt buộc")
    public ResponseEntity<ApiResponse<ShiftResponse>> correctPaymentMethod(
            @PathVariable Long id,
            @PathVariable Long paymentId,
            @Valid @RequestBody PaymentMethodCorrectionRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Đã sửa phương thức thanh toán",
                toResponse(shiftService.correctPaymentMethod(id, paymentId, request))));
    }

    private ShiftResponse toResponse(Shift shift) {
        String cashierName = userRepository.findById(shift.getCashierId())
                .map(u -> u.getFullName() != null ? u.getFullName() : u.getUsername())
                .orElse("N/A");
        return WmsResponseMapper.toShiftResponse(shift, cashierName);
    }
}
