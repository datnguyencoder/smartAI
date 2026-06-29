package com.smartmart.dto.request;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateFinanceCategoryRequest {
    private String name;
    private Boolean active;
}
