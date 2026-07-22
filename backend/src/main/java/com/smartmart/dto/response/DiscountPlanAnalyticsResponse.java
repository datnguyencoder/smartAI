package com.smartmart.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@Builder
public class DiscountPlanAnalyticsResponse {
    private Long planId;
    private String planName;
    private String dealType;
    private boolean active;
    private long ordersCount;
    private BigDecimal totalDiscountGiven;
    private Integer maxUsage;
    private Integer usageCount;
}
