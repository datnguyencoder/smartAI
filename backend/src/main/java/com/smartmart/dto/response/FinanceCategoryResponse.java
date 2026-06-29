package com.smartmart.dto.response;

import com.smartmart.enums.FinanceTransactionType;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class FinanceCategoryResponse {
    private Long id;
    private String name;
    private FinanceTransactionType type;
    private boolean active;
    private LocalDateTime createdAt;
}
