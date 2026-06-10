package com.smartmart.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
public class CreatePromotionRequest {

    @NotBlank
    private String name;

    @NotBlank
    private String code;

    @NotBlank
    private String type;

    @NotNull
    private BigDecimal value;

    private BigDecimal minOrder;

    private LocalDate startDate;

    private LocalDate endDate;

    private Boolean active;
}
