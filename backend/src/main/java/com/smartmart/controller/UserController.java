package com.smartmart.controller;

import com.smartmart.common.response.ApiResponse;
import com.smartmart.dto.request.CreateUserRequest;
import com.smartmart.dto.request.UpdateUserRequest;
import com.smartmart.dto.response.UserResponse;
import com.smartmart.service.UserService;
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
@RequestMapping("/api/v1/users")
@Tag(name = "Users", description = "Quản lý người dùng")
@SecurityRequirement(name = "bearerAuth")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    @Operation(summary = "Danh sách người dùng")
    public ResponseEntity<ApiResponse<List<UserResponse>>> list() {
        return ResponseEntity.ok(ApiResponse.success(userService.listAll()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Chi tiết người dùng")
    public ResponseEntity<ApiResponse<UserResponse>> get(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(userService.getById(id)));
    }

    @PostMapping
    @Operation(summary = "Tạo người dùng")
    @PreAuthorize("hasAnyRole('ADMIN')")
    public ResponseEntity<ApiResponse<UserResponse>> create(@Valid @RequestBody CreateUserRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo người dùng thành công", userService.create(request)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật người dùng")
    @PreAuthorize("hasAnyRole('ADMIN')")
    public ResponseEntity<ApiResponse<UserResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thành công", userService.update(id, request)));
    }

    @PostMapping("/{id}/lock")
    @Operation(summary = "Khóa tài khoản")
    @PreAuthorize("hasAnyRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> lock(@PathVariable Long id) {
        userService.lock(id);
        return ResponseEntity.ok(ApiResponse.success("Khóa tài khoản thành công", null));
    }

    @PostMapping("/{id}/unlock")
    @Operation(summary = "Mở khóa tài khoản")
    @PreAuthorize("hasAnyRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> unlock(@PathVariable Long id) {
        userService.unlock(id);
        return ResponseEntity.ok(ApiResponse.success("Mở khóa tài khoản thành công", null));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa mềm tài khoản nhân viên")
    @PreAuthorize("hasAnyRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> softDelete(@PathVariable Long id) {
        userService.softDelete(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa mềm tài khoản thành công", null));
    }
}
