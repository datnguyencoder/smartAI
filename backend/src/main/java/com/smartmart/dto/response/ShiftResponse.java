package com.smartmart.dto.response;

import com.smartmart.enums.ShiftStatus;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Builder
public class ShiftResponse {
    private Long id;
    private Long cashierId;
    private String cashierName;
    private LocalDateTime openedAt;
    private LocalDateTime closedAt;
    private BigDecimal openingCash;
    private Long openingBalanceSourceShiftId;
    private BigDecimal closingCash;
    private BigDecimal expectedCash;
    private BigDecimal cashVariance;
    private String varianceReason;
    private Boolean staffMismatchReported;
    private String managerNote;
    private String adminNote;
    private String closingNote;
    private Long reviewedBy;
    private LocalDateTime reviewedAt;
    private String reviewNote;
    private Integer totalOrders;
    private BigDecimal totalRevenue;
    private ShiftStatus status;
    private String note;
}
