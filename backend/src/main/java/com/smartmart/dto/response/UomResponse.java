package com.smartmart.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@Builder
public class UomResponse {
    private Long id;
    private String uomName;
    private String category;
    private BigDecimal conversionRatio;
    private boolean active;
    private Long conversionUomId;
    private String conversionUomName;
}
