package com.smartmart.dto.request;

import com.smartmart.enums.CashAccountType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class CreateCashAccountRequest {
    @NotBlank
    private String accountName;

    @NotNull
    private CashAccountType accountType;

    private BigDecimal initialBalance;
}
