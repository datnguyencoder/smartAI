package com.smartmart.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class CreateStockAdjustmentRequest {
    @NotNull
    private Long itemId;

    @NotNull
    private Long locationId;

    private Long lotId;

    @NotNull
    private BigDecimal actualQuantity;

    @DecimalMin(value = "0", inclusive = false)
    private BigDecimal quantityChange;

    private String note;
}
