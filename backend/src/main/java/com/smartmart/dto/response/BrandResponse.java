package com.smartmart.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class BrandResponse {
    private Long id;
    private String brandName;
    private String description;
    private boolean active;
    private LocalDateTime createdAt;
}
