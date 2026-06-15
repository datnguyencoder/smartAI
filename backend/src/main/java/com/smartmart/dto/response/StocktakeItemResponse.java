package com.smartmart.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@Builder
public class StocktakeItemResponse {
    private Long itemId;
    private String itemName;
    private String itemCode;
    private Long lotId;
    private String lotNumber;
    private BigDecimal systemQuantity;
    private BigDecimal actualQuantity;
    private BigDecimal variance;
    private String note;
}
