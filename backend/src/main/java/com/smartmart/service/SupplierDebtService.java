package com.smartmart.service;

import com.smartmart.dto.request.CreateDebtPaymentRequest;
import com.smartmart.entity.SupplierDebt;
import com.smartmart.enums.SupplierDebtStatus;

import java.util.List;

public interface SupplierDebtService {
    List<SupplierDebt> listAll(SupplierDebtStatus status);
    List<SupplierDebt> listBySupplier(Long supplierId);
    SupplierDebt findById(Long id);
    SupplierDebt recordPayment(Long debtId, CreateDebtPaymentRequest request);
    SupplierDebt createFromPurchaseOrder(Long purchaseOrderId, java.time.LocalDate dueDate);
}
