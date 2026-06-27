package com.smartmart.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@Builder
public class InventoryNxtReportResponse {
    private String itemCode;
    private String itemName;
    private String unitName;
    
    private BigDecimal openingQty;
    private BigDecimal openingValue;
    
    private BigDecimal importedQty;
    private BigDecimal importedValue;
    
    private BigDecimal exportedQty;
    private BigDecimal exportedValue;
    
    private BigDecimal closingQty;
    private BigDecimal closingValue;
    
    private BigDecimal referencePrice;
}
