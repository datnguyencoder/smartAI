package com.smartmart.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class CloseShiftRequest {
    @NotNull
    @DecimalMin(value = "0.00")
    private BigDecimal closingCash;
    private String varianceReason;
    private String note;
}
