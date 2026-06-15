package com.smartmart.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class StocktakeLineRequest {
    @NotNull
    private Long itemId;
    private Long lotId;
    private BigDecimal actualQuantity;
    private String note;
}
