package com.smartmart.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@Builder
public class PromotionAnalyticsResponse {
    private Long promotionId;
    private String name;
    private String code;
    private boolean active;
    private long usageCount;
    private BigDecimal totalDiscountGiven;
    private Integer maxUsage;
}
