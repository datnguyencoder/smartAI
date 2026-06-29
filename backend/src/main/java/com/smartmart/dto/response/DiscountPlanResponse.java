package com.smartmart.dto.response;

import com.smartmart.enums.DiscountPlanType;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Builder
public class DiscountPlanResponse {
    private Long id;
    private String planName;
    private DiscountPlanType planType;
    private Long categoryId;
    private String categoryName;
    private Long itemId;
    private String itemName;
    private BigDecimal discountPercent;
    private LocalDate startDate;
    private LocalDate endDate;
    private boolean active;
    private LocalDateTime createdAt;
}
