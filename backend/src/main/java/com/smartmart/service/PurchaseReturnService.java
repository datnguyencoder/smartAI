package com.smartmart.service;

import com.smartmart.dto.request.CreatePurchaseReturnRequest;
import com.smartmart.dto.response.PurchaseReturnResponse;

import java.util.List;

public interface PurchaseReturnService {
    PurchaseReturnResponse create(CreatePurchaseReturnRequest request);

    PurchaseReturnResponse getById(Long id);

    List<PurchaseReturnResponse> listAll();
}
