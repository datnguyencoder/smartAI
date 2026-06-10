package com.smartmart.dto.response;

import com.smartmart.enums.InventoryActionType;
import com.smartmart.enums.ReferenceType;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Builder
public class InventoryLogResponse {
    private Long id;
    private Long itemId;
    private String itemName;
    private Long locationId;
    private String locationName;
    private Long userId;
    private ReferenceType referenceType;
    private Long referenceId;
    private InventoryActionType actionType;
    private BigDecimal quantityBefore;
    private BigDecimal quantityChange;
    private BigDecimal quantityAfter;
    private String note;
    private LocalDateTime createdAt;
}
