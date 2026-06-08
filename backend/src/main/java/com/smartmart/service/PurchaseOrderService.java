package com.smartmart.service;

import com.smartmart.dto.request.CreatePurchaseOrderRequest;
import com.smartmart.dto.response.PurchaseOrderResponse;
import com.smartmart.enums.PurchaseStatus;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.time.LocalDate;

public interface PurchaseOrderService {
    PurchaseOrderResponse create(CreatePurchaseOrderRequest request);

    PurchaseOrderResponse receive(Long purchaseId);

    Page<PurchaseOrderResponse> list(Long supplierId, PurchaseStatus status, LocalDate fromDate, LocalDate toDate, Pageable pageable);

    PurchaseOrderResponse getById(Long id);

    PurchaseOrderResponse cancel(Long id);
}
