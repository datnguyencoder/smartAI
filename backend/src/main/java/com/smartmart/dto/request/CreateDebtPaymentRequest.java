package com.smartmart.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class CreateDebtPaymentRequest {
    @NotNull
    @Positive
    private BigDecimal amount;
    private String paymentMethod;
    private String note;
}
