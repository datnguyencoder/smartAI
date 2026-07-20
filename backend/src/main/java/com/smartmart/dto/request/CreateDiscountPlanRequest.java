package com.smartmart.dto.request;

import com.smartmart.enums.DiscountDealType;
import com.smartmart.enums.DiscountPlanType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
public class CreateDiscountPlanRequest {
    @NotBlank
    private String planName;

    @NotNull
    private DiscountPlanType planType;

    private Long categoryId;
    private Long itemId;

    private DiscountDealType dealType;

    private BigDecimal discountPercent;

    private Integer buyQuantity;
    private Integer freeQuantity;

    private LocalDate startDate;
    private LocalDate endDate;
}
