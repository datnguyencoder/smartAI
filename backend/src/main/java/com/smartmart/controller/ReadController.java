package com.smartmart.controller;

import com.smartmart.common.response.ApiResponse;
import com.smartmart.dto.response.SeenUserResponse;
import com.smartmart.exception.ErrorCode;
import com.smartmart.exception.UnauthorizedException;
import com.smartmart.security.SecurityUtils;
import com.smartmart.service.ReadService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/chat/messages")
@RequiredArgsConstructor
@Tag(name = "Read", description = "Quản lý trạng thái đã đọc tin nhắn")
public class ReadController {

    private final ReadService readService;

    private Long getCurrentUserId() {
        return SecurityUtils.getCurrentUserId()
                .orElseThrow(() -> new UnauthorizedException(ErrorCode.UNAUTHORIZED));
    }

    @PostMapping("/{messageId}/read")
    @Operation(summary = "Đánh dấu tin nhắn đã đọc")
    public ResponseEntity<ApiResponse<Void>> markAsRead(@PathVariable Long messageId) {
        readService.markAsRead(messageId, getCurrentUserId());
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @GetMapping("/{messageId}/seen-users")
    @Operation(summary = "Lấy danh sách user đã xem tin nhắn")
    public ResponseEntity<ApiResponse<List<SeenUserResponse>>> getSeenUsers(@PathVariable Long messageId) {
        List<SeenUserResponse> seenUsers = readService.getSeenUsers(messageId);
        return ResponseEntity.ok(ApiResponse.success(seenUsers));
    }

    @GetMapping("/{messageId}/seen-count")
    @Operation(summary = "Lấy số lượng người đã xem tin nhắn")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getSeenCount(@PathVariable Long messageId) {
        long count = readService.getSeenCount(messageId);
        return ResponseEntity.ok(ApiResponse.success(Map.of("count", count)));
    }
}
