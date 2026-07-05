package com.smartmart.controller;

import com.smartmart.dto.request.AddMemberRequest;
import com.smartmart.common.response.ApiResponse;
import com.smartmart.dto.response.MemberResponse;
import com.smartmart.exception.ErrorCode;
import com.smartmart.exception.UnauthorizedException;
import com.smartmart.security.SecurityUtils;
import com.smartmart.service.ParticipantService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/chat/conversations")
@RequiredArgsConstructor
@Tag(name = "Participant", description = "Quản lý thành viên hội thoại")
public class ParticipantController {

    private final ParticipantService participantService;

    private Long getCurrentUserId() {
        return SecurityUtils.getCurrentUserId()
                .orElseThrow(() -> new UnauthorizedException(ErrorCode.UNAUTHORIZED));
    }

    @PostMapping("/{conversationId}/members")
    @Operation(summary = "Thêm thành viên vào nhóm")
    public ResponseEntity<ApiResponse<Void>> addMember(
            @PathVariable Long conversationId,
            @Valid @RequestBody AddMemberRequest request) {
        participantService.addMember(conversationId, getCurrentUserId(), request.getUserId());
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @DeleteMapping("/{conversationId}/members/{userId}")
    @Operation(summary = "Xóa thành viên khỏi nhóm")
    public ResponseEntity<ApiResponse<Void>> removeMember(
            @PathVariable Long conversationId,
            @PathVariable Long userId) {
        participantService.removeMember(conversationId, getCurrentUserId(), userId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PostMapping("/{conversationId}/leave")
    @Operation(summary = "Tự rời nhóm")
    public ResponseEntity<ApiResponse<Void>> leaveGroup(
            @PathVariable Long conversationId) {
        participantService.leaveGroup(conversationId, getCurrentUserId());
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @GetMapping("/{conversationId}/members")
    @Operation(summary = "Lấy danh sách thành viên nhóm")
    public ResponseEntity<ApiResponse<List<MemberResponse>>> getMembers(
            @PathVariable Long conversationId) {
        List<MemberResponse> members = participantService.getMembers(conversationId, getCurrentUserId());
        return ResponseEntity.ok(ApiResponse.success(members));
    }
}
