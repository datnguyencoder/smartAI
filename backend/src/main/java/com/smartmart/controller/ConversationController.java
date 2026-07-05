package com.smartmart.controller;

import com.smartmart.dto.request.CreateGroupConversationRequest;
import com.smartmart.dto.request.RenameGroupRequest;
import com.smartmart.common.response.ApiResponse;
import com.smartmart.dto.response.ConversationDetailResponse;
import com.smartmart.dto.response.ConversationResponse;
import com.smartmart.common.response.PageResponse;
import com.smartmart.exception.ErrorCode;
import com.smartmart.exception.UnauthorizedException;
import com.smartmart.security.SecurityUtils;
import com.smartmart.service.ConversationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/chat/conversations")
@RequiredArgsConstructor
@Tag(name = "Conversation", description = "Quản lý hộp thoại")
public class ConversationController {

    private final ConversationService conversationService;

    private Long getCurrentUserId() {
        return SecurityUtils.getCurrentUserId()
                .orElseThrow(() -> new UnauthorizedException(ErrorCode.UNAUTHORIZED));
    }

    @PostMapping("/private/{targetUserId}")
    @Operation(summary = "Tạo hoặc lấy hội thoại 1-1")
    public ResponseEntity<ApiResponse<ConversationResponse>> createPrivateConversation(
            @PathVariable Long targetUserId) {
        ConversationResponse response = conversationService.createPrivateConversation(getCurrentUserId(), targetUserId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/group")
    @Operation(summary = "Tạo nhóm chat")
    public ResponseEntity<ApiResponse<ConversationResponse>> createGroup(
            @Valid @RequestBody CreateGroupConversationRequest request) {
        ConversationResponse response = conversationService.createGroupConversation(getCurrentUserId(), request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    @Operation(summary = "Danh sách hội thoại của tôi")
    public ResponseEntity<ApiResponse<PageResponse<ConversationResponse>>> getMyConversations(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<ConversationResponse> pagedResult = conversationService.getMyConversations(getCurrentUserId(),
                PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.success(PageResponse.of(pagedResult)));
    }

    @GetMapping("/{conversationId}")
    @Operation(summary = "Lấy chi tiết hội thoại")
    public ResponseEntity<ApiResponse<ConversationDetailResponse>> getConversationDetail(
            @PathVariable Long conversationId) {
        ConversationDetailResponse response = conversationService.getConversationDetail(conversationId,
                getCurrentUserId());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/{conversationId}/rename")
    @Operation(summary = "Đổi tên nhóm chat")
    public ResponseEntity<ApiResponse<Void>> renameGroup(
            @PathVariable Long conversationId,
            @Valid @RequestBody RenameGroupRequest request) {
        conversationService.renameGroup(conversationId, getCurrentUserId(), request.getName());
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @DeleteMapping("/{conversationId}")
    @Operation(summary = "Giải tán nhóm")
    public ResponseEntity<ApiResponse<Void>> deleteGroup(
            @PathVariable Long conversationId) {
        conversationService.deleteGroup(conversationId, getCurrentUserId());
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PutMapping("/{conversationId}/read")
    @Operation(summary = "Đánh dấu tất cả tin nhắn trong hội thoại là đã đọc")
    public ResponseEntity<ApiResponse<Void>> markConversationAsRead(
            @PathVariable Long conversationId) {
        conversationService.markConversationAsRead(conversationId, getCurrentUserId());
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
