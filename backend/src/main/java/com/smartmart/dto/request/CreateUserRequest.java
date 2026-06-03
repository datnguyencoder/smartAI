package com.smartmart.dto.request;

import com.smartmart.enums.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateUserRequest {
    @NotBlank
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
