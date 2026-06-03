package com.smartmart.service;

import com.smartmart.entity.Item;
import com.smartmart.entity.ItemLot;
import com.smartmart.entity.Location;
import com.smartmart.enums.InventoryActionType;
import com.smartmart.enums.ReferenceType;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface InventoryLedgerService {

    record LotAllocation(ItemLot lot, BigDecimal quantity) {}

    void applyMovement(
            Item item,
            Location location,
            ItemLot lot,
            BigDecimal quantityChange,
            InventoryActionType actionType,
            ReferenceType referenceType,
            Long referenceId,
            UUID userId,
            String note
    );

    List<LotAllocation> allocateFefo(Item item, Location location, BigDecimal quantityNeeded);

    void validateLotNotExpired(ItemLot lot);

    ItemLot getOrCreateLot(Item item, String lotNumber, LocalDate expiryDate);
}
