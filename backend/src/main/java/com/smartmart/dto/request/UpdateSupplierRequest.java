package com.smartmart.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateSupplierRequest {
    @NotBlank
    private String supplierName;
    private String contactPerson;
    private String phone;
    private String email;
    private String address;
    private boolean active;
}
