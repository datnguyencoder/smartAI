package com.smartmart.dto.request;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateBrandRequest {
    private String brandName;
    private String description;
    private Boolean active;
}
