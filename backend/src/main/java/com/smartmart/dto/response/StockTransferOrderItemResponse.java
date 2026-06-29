package com.smartmart.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@Builder
public class StockTransferOrderItemResponse {
    private Long id;
    private Long itemId;
    private String itemName;
    private Long lotId;
    private String lotNumber;
    private BigDecimal quantity;
}
