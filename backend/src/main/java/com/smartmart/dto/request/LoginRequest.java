package com.smartmart.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Schema(description = "Đăng nhập")
public class LoginRequest {
    @NotBlank
    private String username;
    @NotBlank
    private String password;
}
