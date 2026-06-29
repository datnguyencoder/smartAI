package com.smartmart.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Builder
public class ShiftSummaryResponse {
    private Long shiftId;
    private String cashierName;
    private LocalDateTime openedAt;
    private LocalDateTime closedAt;
    private String status;
    private BigDecimal openingCash;
    private BigDecimal closingCash;
    private BigDecimal expectedCash;
    private BigDecimal cashVariance;
    private int totalOrders;
    private BigDecimal totalRevenue;
    private BigDecimal cashSales;
    private BigDecimal bankSales;
}
