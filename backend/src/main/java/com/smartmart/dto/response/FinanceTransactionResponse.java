package com.smartmart.dto.response;

import com.smartmart.enums.FinancePaymentAccount;
import com.smartmart.enums.FinanceTransactionType;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Builder
public class FinanceTransactionResponse {
    private Long id;
    private FinanceTransactionType type;
    private String category;
    private Long categoryId;
    private Long cashAccountId;
    private BigDecimal amount;
    private FinancePaymentAccount paymentAccount;
    private LocalDate transactionDate;
    private String note;
    private Long createdBy;
    private LocalDateTime createdAt;
}
