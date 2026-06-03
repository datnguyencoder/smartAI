package com.smartmart.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class CategoryResponse {
    private Long id;
    private String categoryName;
    private Long parentId;
    private boolean active;
}
