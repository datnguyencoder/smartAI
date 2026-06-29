package com.smartmart.service;

import com.smartmart.dto.request.CreateQuotationRequest;
import com.smartmart.dto.response.OrderResponse;
import com.smartmart.dto.response.QuotationResponse;

import java.util.List;

public interface QuotationService {
    QuotationResponse create(CreateQuotationRequest request);

    QuotationResponse getById(Long id);

    List<QuotationResponse> listAll();

    OrderResponse convertToOrder(Long id);
}
