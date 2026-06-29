package com.smartmart.dto.response;

import com.smartmart.enums.FinanceTransactionType;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Builder
public class CashFlowReportResponse {
    private LocalDate date;
    private FinanceTransactionType type;
    private String category;
    private BigDecimal amount;
    private BigDecimal runningBalance;
}
