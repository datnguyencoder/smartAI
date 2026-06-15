package com.smartmart.dto.request;

import com.smartmart.enums.PaymentMethod;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class OrderPaymentRequest {
    @NotNull
    private PaymentMethod paymentMethod;
    @NotNull
    @Positive
    private BigDecimal amount;
}
