package com.smartmart.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class CreateUomRequest {
    @NotBlank
    private String uomName;
    private String category;
    @NotNull
    private BigDecimal conversionRatio = BigDecimal.ONE;
    private boolean baseUnit;
}
