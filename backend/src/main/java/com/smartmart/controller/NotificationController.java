package com.smartmart.controller;

import com.smartmart.common.response.ApiResponse;
import com.smartmart.dto.response.NotificationResponse;
import com.smartmart.common.response.PageResponse;
import com.smartmart.exception.ErrorCode;
import com.smartmart.exception.UnauthorizedException;
import com.smartmart.security.SecurityUtils;
import com.smartmart.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/chat/notifications")
@RequiredArgsConstructor
@Tag(name = "Notification", description = "Quản lý thông báo")
public class NotificationController {

    private final NotificationService notificationService;

    private Long getCurrentUserId() {
        return SecurityUtils.getCurrentUserId()
                .orElseThrow(() -> new UnauthorizedException(ErrorCode.UNAUTHORIZED));
    }

    @GetMapping
    @Operation(summary = "Lấy danh sách thông báo")
    public ResponseEntity<ApiResponse<PageResponse<NotificationResponse>>> getNotifications(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<NotificationResponse> pagedResult = notificationService.getNotifications(getCurrentUserId(), PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.success(PageResponse.of(pagedResult)));
    }

    @PutMapping("/{notificationId}/read")
    @Operation(summary = "Đánh dấu 1 thông báo là đã đọc")
    public ResponseEntity<ApiResponse<Void>> markAsRead(@PathVariable Long notificationId) {
        notificationService.markAsRead(notificationId, getCurrentUserId());
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PutMapping("/read-all")
    @Operation(summary = "Đánh dấu tất cả thông báo là đã đọc")
    public ResponseEntity<ApiResponse<Void>> markAllAsRead() {
        notificationService.markAllAsRead(getCurrentUserId());
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @GetMapping("/unread-count")
    @Operation(summary = "Lấy số lượng thông báo chưa đọc")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getUnreadCount() {
        long count = notificationService.getUnreadCount(getCurrentUserId());
        return ResponseEntity.ok(ApiResponse.success(Map.of("count", count)));
    }
}
