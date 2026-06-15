package com.smartmart.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class CloseShiftRequest {
    @NotNull
    private BigDecimal closingCash;
    private String note;
}
