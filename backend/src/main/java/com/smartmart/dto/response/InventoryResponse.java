package com.smartmart.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Builder
public class InventoryResponse {
    private Long id;
    private Long itemId;
    private String itemCode;
    private String itemName;
    private Long locationId;
    private String locationName;
    private Long lotId;
    private String lotNumber;
    private LocalDate expiryDate;
    private BigDecimal quantity;
    private BigDecimal reservedQuantity;
    private BigDecimal availableQuantity;
}
