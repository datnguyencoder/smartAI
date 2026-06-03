package com.smartmart.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
public class ReceiveLineRequest {
    @NotNull
    private Long purchaseItemId;
    @NotNull
    @DecimalMin("0.0001")
    private BigDecimal receiveQty;
    private String lotNumber;
    private LocalDate expiryDate;
}
