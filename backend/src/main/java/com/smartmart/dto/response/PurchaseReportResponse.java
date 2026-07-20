package com.smartmart.dto.response;

import lombok.Builder;
import lombok.Getter;
import java.math.BigDecimal;

@Getter
@Builder
public class PurchaseReportResponse {
    private Long supplierId;
    private String supplierName;
    private long totalOrders;
    private BigDecimal totalAmount;
    private long totalItemTypes;
    private BigDecimal totalQuantity;
    private BigDecimal totalRefundedAmount;
    private BigDecimal discrepancyRate;
}
