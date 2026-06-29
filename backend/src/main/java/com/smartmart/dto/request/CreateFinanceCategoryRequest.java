package com.smartmart.dto.request;

import com.smartmart.enums.FinanceTransactionType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateFinanceCategoryRequest {
    @NotBlank
    private String name;

    @NotNull
    private FinanceTransactionType type;
}
