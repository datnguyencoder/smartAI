package com.smartmart.dto.response;

import com.smartmart.enums.GiftCardStatus;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Builder
public class GiftCardResponse {
    private Long id;
    private String cardCode;
    private BigDecimal initialBalance;
    private BigDecimal currentBalance;
    private GiftCardStatus status;
    private LocalDateTime issuedAt;
    private LocalDate expiresAt;
    private String note;
}
