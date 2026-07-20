package com.smartmart.dto.response;

import com.smartmart.enums.DiscountDealType;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@Builder
public class DiscountApplyResponse {
    private Long itemId;
    private DiscountDealType dealType;
    private BigDecimal discountPercent;
    private Integer buyQuantity;
    private Integer freeQuantity;
    private Long planId;
    private String planName;
}
