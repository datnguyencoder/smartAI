package com.smartmart.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class StockTransferLineRequest {
    @NotNull
    private Long itemId;

    private Long lotId;

    @NotNull
    @Positive
    private BigDecimal quantity;
}
