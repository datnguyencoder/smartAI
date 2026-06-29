package com.smartmart.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class QuotationLineRequest {
    @NotNull
    private Long itemId;

    @NotNull
    @Positive
    private BigDecimal quantity;

    private BigDecimal unitPrice;
}
