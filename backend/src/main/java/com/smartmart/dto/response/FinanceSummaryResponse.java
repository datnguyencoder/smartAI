package com.smartmart.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@Builder
public class FinanceSummaryResponse {
    private BigDecimal salesRevenue;
    private BigDecimal refundAmount;
    private BigDecimal totalIncome;
    private BigDecimal totalExpense;
    private BigDecimal netCashFlow;
    private BigDecimal allTimeRevenue;
    private BigDecimal currentStoreMoney;
}
