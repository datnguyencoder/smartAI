package com.smartmart.dto.response;

import com.smartmart.enums.PurchaseReturnStatus;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class PurchaseReturnResponse {
    private Long id;
    private Long supplierId;
    private String supplierName;
    private Long locationId;
    private String locationName;
    private Long purchaseOrderId;
    private PurchaseReturnStatus status;
    private LocalDateTime returnDate;
    private BigDecimal totalAmount;
    private String note;
    private List<PurchaseReturnItemResponse> items;
}
