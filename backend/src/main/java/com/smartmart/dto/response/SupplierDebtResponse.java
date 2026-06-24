package com.smartmart.dto.response;

import com.smartmart.enums.SupplierDebtStatus;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Getter
@Builder
public class SupplierDebtResponse {
    private Long id;
    private Long supplierId;
    private String supplierName;
    private Long purchaseOrderId;
    private BigDecimal amount;
    private BigDecimal paidAmount;
    private BigDecimal remainingAmount;
    private LocalDate dueDate;
    private SupplierDebtStatus status;
    private String note;
    private List<DebtPaymentResponse> payments;
}
