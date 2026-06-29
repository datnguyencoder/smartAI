package com.smartmart.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Builder
public class ProfitLossReportResponse {
    private LocalDate date;
    private BigDecimal revenue;
    private BigDecimal costOfGoods;
    private BigDecimal grossProfit;
    private BigDecimal expenses;
    private BigDecimal netProfit;
}
