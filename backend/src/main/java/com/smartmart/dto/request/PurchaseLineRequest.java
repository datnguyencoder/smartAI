package com.smartmart.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
public class PurchaseLineRequest {
    @NotNull
    private Long itemId;
    @NotNull
    @DecimalMin("0.0001")
    private BigDecimal orderedQty;
    @NotNull
    @DecimalMin("0")
    private BigDecimal unitPrice;
    private String lotNumber;
    private LocalDate expiryDate;
}
