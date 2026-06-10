package com.smartmart.dto.request;

import com.smartmart.enums.Role;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateUserRequest {
    @NotBlank(message = "Tên đăng nhập không được để trống")
    @Size(min = 4, max = 50, message = "Tên đăng nhập phải có độ dài từ 4 đến 50 ký tự")
    @Pattern(regexp = "^[a-zA-Z0-9_.]+$",  message = "Tên đăng nhập chỉ được chứa chữ không dấu, số, dấu chấm và dấu gạch dưới")
    private String username;

    @NotBlank
    @Size(min = 6)
    private String password;

    @NotBlank
    @Email
    private String email;

    private String fullName;

    @NotNull
    private Role role;
}
