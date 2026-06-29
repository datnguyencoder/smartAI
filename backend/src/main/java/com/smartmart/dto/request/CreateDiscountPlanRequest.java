package com.smartmart.dto.request;

import com.smartmart.enums.DiscountPlanType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
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

    @NotNull
    @Positive
    private BigDecimal discountPercent;

    private LocalDate startDate;
    private LocalDate endDate;
}
