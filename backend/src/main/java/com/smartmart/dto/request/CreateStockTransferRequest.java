package com.smartmart.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class CreateStockTransferRequest {
    @NotNull
    private Long itemId;

    @NotNull
    private Long fromLocationId;

    @NotNull
    private Long toLocationId;

    private Long lotId;

    @NotNull
    @DecimalMin(value = "0", inclusive = false)
    private BigDecimal quantity;

    private String note;
}
