package com.smartmart.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateCategoryRequest {
    @NotBlank
    private String categoryName;
    private Long parentId;
    private Boolean active;
    @Size(max = 255)
    private String uomCategories;
}
