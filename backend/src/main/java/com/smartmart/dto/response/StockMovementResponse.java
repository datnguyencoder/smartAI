package com.smartmart.dto.response;

import com.smartmart.enums.InventoryActionType;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Builder
public class StockMovementResponse {
    private Long itemId;
    private String itemName;
    private Long fromLocationId;
    private String fromLocationName;
    private Long toLocationId;
    private String toLocationName;
    private Long locationId;
    private String locationName;
    private Long lotId;
    private String lotNumber;
    private InventoryActionType actionType;
    private BigDecimal quantity;
    private BigDecimal quantityBefore;
    private BigDecimal quantityAfter;
    private String note;
    private LocalDateTime createdAt;
}
