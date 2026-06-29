package com.smartmart.dto.response;

import com.smartmart.enums.CustomerDebtStatus;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Builder
public class CustomerDueReportResponse {
    private Long debtId;
    private Long customerId;
    private String customerName;
    private Long orderId;
    private BigDecimal amount;
    private BigDecimal paidAmount;
    private BigDecimal remainingAmount;
    private LocalDate dueDate;
    private CustomerDebtStatus status;
}
