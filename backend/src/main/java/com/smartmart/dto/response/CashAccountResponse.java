package com.smartmart.dto.response;

import com.smartmart.enums.CashAccountType;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Builder
public class CashAccountResponse {
    private Long id;
    private String accountName;
    private CashAccountType accountType;
    private BigDecimal balance;
    private boolean active;
    private LocalDateTime createdAt;
}
