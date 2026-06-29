package com.smartmart.dto.response;

import com.smartmart.enums.CustomerDebtStatus;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class CustomerDebtResponse {
    private Long id;
    private Long customerId;
    private String customerName;
    private String customerPhone;
    private Long orderId;
    private String orderCode;
    private BigDecimal amount;
    private BigDecimal paidAmount;
    private BigDecimal remainingAmount;
    private LocalDate dueDate;
    private CustomerDebtStatus status;
    private String note;
    private LocalDateTime createdAt;
    private List<CustomerDebtPaymentResponse> payments;
}
