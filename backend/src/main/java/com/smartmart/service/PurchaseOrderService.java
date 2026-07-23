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

    /**
     * Đóng vĩnh viễn 1 phiếu đang PARTIALLY_RECEIVED khi NCC xác nhận không giao thêm phần còn
     * thiếu — chuyển sang COMPLETED, tính lại totalAmount theo đúng số lượng ĐÃ NHẬN THỰC TẾ
     * (không phải số lượng đặt ban đầu) để công nợ không bị tính thừa cho hàng chưa từng về kho.
     */
    PurchaseOrderResponse finalizeShortShipment(Long purchaseId, String reason);

    Page<PurchaseOrderResponse> list(Long supplierId, Long locationId, String search, PurchaseStatus status,
            LocalDate fromDate, LocalDate toDate, Pageable pageable);

    PurchaseOrderResponse getById(Long id);

    PurchaseOrderResponse cancel(Long id);

    List<PurchaseOrderResponse> listAll();

    List<PurchaseOrderResponse> listByStatus(PurchaseStatus status);

}
