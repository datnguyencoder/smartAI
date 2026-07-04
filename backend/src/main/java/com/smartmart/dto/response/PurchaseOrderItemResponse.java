package com.smartmart.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Builder
public class PurchaseOrderItemResponse implements Serializable {
    private static final long serialVersionUID = 1L;
    private Long id;
    private Long itemId;
    private String itemName;
    private BigDecimal orderedQty;
    private BigDecimal receivedQty;
    private BigDecimal unitPrice;
    private BigDecimal subtotal;
    private String uomName;
    private String purchaseUomName;
    private BigDecimal purchaseRatio;
    private String lotCode;
    private LocalDate expiryDate;
}
