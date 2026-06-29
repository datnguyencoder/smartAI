package com.smartmart.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Builder
public class InventoryAlertResponse {
    private Long id;
    private Long itemId;
    private String itemCode;
    private String itemName;
    private String alertType;
    private String severity;
    private String message;
    private boolean resolved;
    private LocalDateTime createdAt;
    
    // Additional fields for stock visibility
    private BigDecimal currentStock;
    private BigDecimal reservedQuantity;
    private BigDecimal availableQuantity;
    private Integer minimumStock;
    private String locationName;
}
