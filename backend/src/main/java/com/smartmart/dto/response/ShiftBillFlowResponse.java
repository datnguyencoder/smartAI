package com.smartmart.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Builder
public class ShiftBillFlowResponse {
    private LocalDateTime occurredAt;
    private String transactionType;
    private Long shiftId;
    private String billCode;
    private Long returnOrderId;
    private String itemSummary;
    private String paymentMethods;
    private BigDecimal amount;
    private boolean afterShiftClosed;
}
