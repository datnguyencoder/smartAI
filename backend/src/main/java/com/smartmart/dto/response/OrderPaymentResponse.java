package com.smartmart.dto.response;

import com.smartmart.enums.PaymentMethod;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@Builder
public class OrderPaymentResponse {
    private PaymentMethod paymentMethod;
    private BigDecimal amount;
}
