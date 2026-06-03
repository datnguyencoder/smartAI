package com.smartmart.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class ScrapLineRequest {
    @NotNull
    private Long itemId;
    private Long lotId;
    @NotNull
    @DecimalMin("0.0001")
    private BigDecimal quantity;
    private String reason;
}
