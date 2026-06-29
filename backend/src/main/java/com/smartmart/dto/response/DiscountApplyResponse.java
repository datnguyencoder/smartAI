package com.smartmart.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@Builder
public class DiscountApplyResponse {
    private Long itemId;
    private BigDecimal discountPercent;
    private Long planId;
    private String planName;
}
