package com.smartmart.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.DecimalMin;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class StocktakeLineRequest {
    @NotNull
    private Long itemId;
    private Long lotId;
    @DecimalMin(value = "0.0", inclusive = true)
    private BigDecimal actualQuantity;
    private String note;
}
