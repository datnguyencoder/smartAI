package com.smartmart.controller;

import com.smartmart.dto.request.EditMessageRequest;
import com.smartmart.dto.request.ReplyMessageRequest;
import com.smartmart.dto.request.SendImageMessageRequest;
import com.smartmart.dto.request.SendMessageRequest;
import com.smartmart.common.response.ApiResponse;
import com.smartmart.dto.response.MessageResponse;
import com.smartmart.common.response.PageResponse;
import com.smartmart.exception.ErrorCode;
import com.smartmart.exception.UnauthorizedException;
import com.smartmart.security.SecurityUtils;
import com.smartmart.service.MessageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/chat")
@RequiredArgsConstructor
@Tag(name = "Message", description = "Quản lý tin nhắn")
public class MessageController {

    private final MessageService messageService;

    private Long getCurrentUserId() {
        return SecurityUtils.getCurrentUserId()
                .orElseThrow(() -> new UnauthorizedException(ErrorCode.UNAUTHORIZED));
    }

    @PostMapping("/messages/text")
    @Operation(summary = "Gửi tin nhắn văn bản")
    public ResponseEntity<ApiResponse<MessageResponse>> sendTextMessage(
            @Valid @RequestBody SendMessageRequest request) {
        MessageResponse response = messageService.sendTextMessage(getCurrentUserId(), request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/messages/image")
    @Operation(summary = "Gửi tin nhắn hình ảnh")
    public ResponseEntity<ApiResponse<MessageResponse>> sendImageMessage(
            @Valid @RequestBody SendImageMessageRequest request) {
        MessageResponse response = messageService.sendImageMessage(getCurrentUserId(), request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/conversations/{conversationId}/messages")
    @Operation(summary = "Lấy lịch sử tin nhắn")
    public ResponseEntity<ApiResponse<PageResponse<MessageResponse>>> getMessages(
            @PathVariable Long conversationId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "30") int size) {
        Page<MessageResponse> pagedResult = messageService.getMessages(conversationId, getCurrentUserId(),
                PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.success(PageResponse.of(pagedResult)));
    }

    @PostMapping("/messages/{messageId}/recall")
    @Operation(summary = "Thu hồi tin nhắn")
    public ResponseEntity<ApiResponse<Void>> recallMessage(
            @PathVariable Long messageId) {
        messageService.recallMessage(messageId, getCurrentUserId());
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PutMapping("/messages/{messageId}")
    @Operation(summary = "Chỉnh sửa tin nhắn")
    public ResponseEntity<ApiResponse<Void>> editMessage(
            @PathVariable Long messageId,
            @Valid @RequestBody EditMessageRequest request) {
        messageService.editMessage(messageId, getCurrentUserId(), request);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PostMapping("/messages/reply")
    @Operation(summary = "Trả lời tin nhắn")
    public ResponseEntity<ApiResponse<MessageResponse>> replyMessage(
            @Valid @RequestBody ReplyMessageRequest request) {
        MessageResponse response = messageService.replyMessage(getCurrentUserId(), request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
