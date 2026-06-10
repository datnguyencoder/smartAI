package com.smartmart.dto.request;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateCustomerRequest {
    private String fullName;
    private String phone;
    private String email;
}
