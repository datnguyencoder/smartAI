package com.smartmart.dto.request;

import com.smartmart.enums.Role;
import com.smartmart.enums.UserStatus;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateUserRequest {
    @Size(max = 100)
    private String fullName;

    @Email
    private String email;

}
