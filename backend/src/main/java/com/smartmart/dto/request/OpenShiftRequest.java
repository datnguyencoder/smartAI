package com.smartmart.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class OpenShiftRequest {
    @DecimalMin(value = "0.00")
    private BigDecimal openingCash;
    @NotBlank
    private String note;
}
