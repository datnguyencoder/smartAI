package com.smartmart.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@Builder
public class QuotationItemResponse {
    private Long id;
    private Long itemId;
    private String itemName;
    private BigDecimal quantity;
    private BigDecimal unitPrice;
    private BigDecimal subtotal;
}
