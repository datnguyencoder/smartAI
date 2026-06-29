package com.smartmart.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
@Getter
@Setter
public class UpdateUomRequest {
    @NotBlank
    private String uomName;
    @NotBlank
    private String category;
    @NotNull
    @DecimalMin("0.0001")
    private BigDecimal conversionRatio;
    private Boolean baseUnit;
    private Boolean active;
}
