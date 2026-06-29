package com.smartmart.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class RedeemGiftCardRequest {
    @NotBlank
    private String cardCode;

    @NotNull
    @Positive
    private BigDecimal amount;
}
