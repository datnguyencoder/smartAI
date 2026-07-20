package com.smartmart.dto.request;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
public class UpdateDiscountPlanRequest {
    private String planName;
    private BigDecimal discountPercent;
    private Integer buyQuantity;
    private Integer freeQuantity;
    private LocalDate startDate;
    private LocalDate endDate;
    private Boolean active;
}
