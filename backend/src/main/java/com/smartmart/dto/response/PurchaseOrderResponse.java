package com.smartmart.dto.response;

import com.smartmart.enums.PurchaseStatus;
import lombok.Builder;
import lombok.Getter;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class PurchaseOrderResponse implements Serializable {
    private static final long serialVersionUID = 1L;
    private Long id;
    private Long supplierId;
    private String supplierName;
    private Long locationId;
    private String locationName;
    private PurchaseStatus status;
    private LocalDateTime purchaseDate;
    private LocalDateTime completedAt;
    private BigDecimal totalAmount;
    private List<PurchaseOrderItemResponse> items;
}
