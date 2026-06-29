package com.smartmart.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
public class IssueGiftCardRequest {
    @NotNull
    @Positive
    private BigDecimal initialBalance;

    private LocalDate expiresAt;
    private String note;
}
