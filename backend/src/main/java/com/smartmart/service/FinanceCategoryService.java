package com.smartmart.service;

import com.smartmart.dto.request.CreateFinanceCategoryRequest;
import com.smartmart.dto.request.UpdateFinanceCategoryRequest;
import com.smartmart.dto.response.FinanceCategoryResponse;
import com.smartmart.enums.FinanceTransactionType;

import java.util.List;

public interface FinanceCategoryService {
    FinanceCategoryResponse create(CreateFinanceCategoryRequest request);

    FinanceCategoryResponse update(Long id, UpdateFinanceCategoryRequest request);

    FinanceCategoryResponse getById(Long id);

    List<FinanceCategoryResponse> list(FinanceTransactionType type);
}
