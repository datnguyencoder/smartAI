package com.smartmart.dto.request;

import com.smartmart.enums.PaymentMethod;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PaymentMethodCorrectionRequest {
    @NotNull
    private PaymentMethod paymentMethod;
    @NotBlank
    private String reason;
}
