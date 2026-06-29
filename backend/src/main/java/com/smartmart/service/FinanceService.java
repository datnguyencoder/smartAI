package com.smartmart.service;

import com.smartmart.dto.request.CreateFinanceTransactionRequest;
import com.smartmart.dto.response.FinanceSummaryResponse;
import com.smartmart.dto.response.FinanceTransactionResponse;
import com.smartmart.enums.FinanceTransactionType;

import java.time.LocalDate;
import java.util.List;

public interface FinanceService {
    FinanceTransactionResponse create(CreateFinanceTransactionRequest request);

    List<FinanceTransactionResponse> list(FinanceTransactionType type, LocalDate from, LocalDate to);

    FinanceSummaryResponse summary(LocalDate from, LocalDate to);
}
