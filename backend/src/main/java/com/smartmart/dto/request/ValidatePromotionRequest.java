package com.smartmart.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class ValidatePromotionRequest {

    @NotBlank
    private String code;

    @NotNull
    private BigDecimal orderSubtotal;
}
