package com.smartmart.dto.request;

import com.smartmart.enums.FinancePaymentAccount;
import com.smartmart.enums.FinanceTransactionType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
public class CreateFinanceTransactionRequest {
    @NotNull
    private FinanceTransactionType type;

    private String category;

    private Long categoryId;

    private Long cashAccountId;

    @NotNull
    @Positive
    private BigDecimal amount;

    @NotNull
    private FinancePaymentAccount paymentAccount;

    @NotNull
    private LocalDate transactionDate;

    private String note;
}
