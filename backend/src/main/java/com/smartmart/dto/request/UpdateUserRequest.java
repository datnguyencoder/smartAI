package com.smartmart.dto.request;

import com.smartmart.enums.Role;
import com.smartmart.enums.UserStatus;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateUserRequest {
    private String fullName;
    private String email;
    private Role role;
    private UserStatus status;
}
