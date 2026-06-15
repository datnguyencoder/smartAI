package com.smartmart.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Builder
public class DebtPaymentResponse {
    private Long id;
    private BigDecimal amount;
    private LocalDateTime paymentDate;
    private String paymentMethod;
    private String note;
    private Long createdBy;
}
