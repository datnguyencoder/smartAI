package com.smartmart.dto.response;

import com.smartmart.enums.SupplierDebtStatus;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Builder
public class SupplierDueReportResponse {
    private Long debtId;
    private Long supplierId;
    private String supplierName;
    private Long purchaseOrderId;
    private BigDecimal amount;
    private BigDecimal paidAmount;
    private BigDecimal remainingAmount;
    private LocalDate dueDate;
    private SupplierDebtStatus status;
}
