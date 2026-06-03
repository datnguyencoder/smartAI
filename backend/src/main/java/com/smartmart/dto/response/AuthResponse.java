package com.smartmart.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@Schema(description = "Token đăng nhập")
public class AuthResponse {
    private String accessToken;
    private String tokenType;
    private UserResponse user;
}
