package com.smartmart.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Builder
public class ShiftMoneyFlowResponse {
    private LocalDateTime occurredAt;
    private String transactionType;
    private String referenceCode;
    private String description;
    private String paymentMethod;
    private BigDecimal moneyIn;
    private BigDecimal moneyOut;
    private BigDecimal amount;
    private String actorName;
}
