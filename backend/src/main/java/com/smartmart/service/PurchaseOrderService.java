package com.smartmart.service;

import com.smartmart.dto.request.CreatePurchaseOrderRequest;
import com.smartmart.dto.request.ReceivePurchaseRequest;
import com.smartmart.dto.response.PurchaseOrderResponse;

import java.util.List;

public interface PurchaseOrderService {

    PurchaseOrderResponse create(CreatePurchaseOrderRequest request);

    PurchaseOrderResponse receive(Long purchaseId, ReceivePurchaseRequest request);

    List<PurchaseOrderResponse> listAll();

    PurchaseOrderResponse getById(Long id);

    PurchaseOrderResponse cancel(Long id);
}
