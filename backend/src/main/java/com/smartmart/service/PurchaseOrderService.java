package com.smartmart.service;

import com.smartmart.dto.request.CreatePurchaseOrderRequest;
import com.smartmart.dto.response.PurchaseOrderResponse;
import com.smartmart.enums.PurchaseStatus;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.time.LocalDate;
import java.util.List;

public interface PurchaseOrderService {

    PurchaseOrderResponse create(CreatePurchaseOrderRequest request);

    PurchaseOrderResponse receive(Long purchaseId);

    PurchaseOrderResponse receivePartial(Long purchaseId, com.smartmart.dto.request.PartialReceivePurchaseRequest request);

    Page<PurchaseOrderResponse> list(Long supplierId, Long locationId, String search, PurchaseStatus status,
            LocalDate fromDate, LocalDate toDate, Pageable pageable);

    PurchaseOrderResponse getById(Long id);

    PurchaseOrderResponse cancel(Long id);

    List<PurchaseOrderResponse> listAll();

    List<PurchaseOrderResponse> listByStatus(PurchaseStatus status);

}
