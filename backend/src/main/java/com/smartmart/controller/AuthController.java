package com.smartmart.controller;

import com.smartmart.common.response.ApiResponse;
import com.smartmart.dto.request.LoginRequest;
import com.smartmart.dto.response.AuthResponse;
import com.smartmart.dto.response.UserResponse;
import com.smartmart.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "Auth", description = "Xác thực JWT")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    @Operation(summary = "Đăng nhập")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Đăng nhập thành công", authService.login(request)));
    }

    @GetMapping("/me")
    @Operation(summary = "Thông tin user hiện tại")
    public ResponseEntity<ApiResponse<UserResponse>> me() {
        return ResponseEntity.ok(ApiResponse.success(authService.me()));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Làm mới access token")
    public ResponseEntity<ApiResponse<AuthResponse>> refresh(
            @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        return ResponseEntity.ok(ApiResponse.success("Làm mới token thành công", authService.refresh(authorization)));
    }

    @PostMapping("/logout")
    @Operation(summary = "Đăng xuất (client xóa token)")
    public ResponseEntity<ApiResponse<Void>> logout() {
        return ResponseEntity.ok(ApiResponse.success("Đăng xuất thành công", null));
    }
}
