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
    private int completedOrders;
    private int cancelledOrders;
    private int refundedOrders;
    private BigDecimal grossSales;
    private BigDecimal refundAmount;
    private BigDecimal cashRefundAmount;
    private BigDecimal nonCashRefundAmount;
    private BigDecimal netRevenue;
    private BigDecimal totalRevenue;
    private BigDecimal cashSales;
    private BigDecimal bankSales;
    private BigDecimal cardSales;
    private BigDecimal walletSales;
    private BigDecimal otherSales;
    private BigDecimal nonCashSales;
    private BigDecimal cashDrawerEndingAmount;
    private BigDecimal storeMoneyMovement;
    private BigDecimal refundAmountAtClose;
    private BigDecimal postCloseRefundAmount;
    private BigDecimal revenueAfterPostCloseReturns;
}
