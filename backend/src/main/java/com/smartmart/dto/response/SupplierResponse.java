package com.smartmart.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class SupplierResponse {
    private Long id;
    private String supplierName;
    private String contactPerson;
    private String phone;
    private String email;
    private boolean active;
}
