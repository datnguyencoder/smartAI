package com.smartmart.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Builder
public class ShiftDashboardResponse {
    private BigDecimal currentStoreMoney;
    private BigDecimal currentCashDrawerAmount;
    private BigDecimal totalCashCollected;
    private BigDecimal totalNonCashCollected;
    private BigDecimal totalRefunded;
    private int activeShiftCount;
    private int pendingManagerCount;
    private int pendingAdminCount;
    private ShiftStatistics statistics;
    private List<ShiftResponse> recentShifts;

    @Getter
    @Builder
    public static class ShiftStatistics {
        private int totalShifts;
        private int totalCompletedOrders;
        private int totalCancelledOrders;
        private BigDecimal totalCashCollected;
        private BigDecimal totalNonCashCollected;
        private BigDecimal totalRefunded;
        private BigDecimal currentStoreMoney;
    }
}
