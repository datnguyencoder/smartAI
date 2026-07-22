package com.smartmart.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Builder
public class PromotionResponse {
    private Long id;
    private String name;
    private String code;
    private String type;
    private BigDecimal value;
    private BigDecimal minOrder;
    private LocalDate startDate;
    private LocalDate endDate;
    private boolean active;
    private Integer maxUsage;
    private Integer usageCount;
    private Integer maxPerCustomer;
    private boolean stackable;
    private LocalDateTime createdAt;
}
