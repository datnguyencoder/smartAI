package com.smartmart.dto.response;

import com.smartmart.enums.Role;
import com.smartmart.enums.UserStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;

import java.util.UUID;

@Getter
@Builder
@Schema(description = "Thông tin người dùng")
public class UserResponse {
    private UUID id;
    private String username;
    private String email;
    private String fullName;
    private String role;
    private UserStatus status;
}
