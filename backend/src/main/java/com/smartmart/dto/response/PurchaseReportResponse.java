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
    private BigDecimal totalAmount;     // Tổng giá trị nhập
    private long totalItemTypes;        // Số loại SP đã nhập
    private BigDecimal totalQuantity;   // Tổng SL nhập
}
