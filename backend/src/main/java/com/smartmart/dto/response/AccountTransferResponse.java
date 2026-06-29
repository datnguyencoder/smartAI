package com.smartmart.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Builder
public class AccountTransferResponse {
    private Long id;
    private Long fromAccountId;
    private String fromAccountName;
    private Long toAccountId;
    private String toAccountName;
    private BigDecimal amount;
    private LocalDate transferDate;
    private String note;
    private LocalDateTime createdAt;
}
