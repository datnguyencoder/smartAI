package com.smartmart.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class OpenShiftRequest {
    @NotNull
    @DecimalMin(value = "0.00")
    private BigDecimal openingCash;
    private String note;
}
