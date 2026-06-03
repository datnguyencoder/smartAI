package com.smartmart.service.impl;

import com.smartmart.entity.*;
import com.smartmart.enums.InventoryActionType;
import com.smartmart.enums.ReferenceType;
import com.smartmart.exception.BadRequestException;
import com.smartmart.exception.InsufficientStockException;
import com.smartmart.repository.CurrentInventoryRepository;
import com.smartmart.repository.InventoryLogRepository;
import com.smartmart.repository.ItemLotRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class InventoryLedgerServiceImpl implements com.smartmart.service.InventoryLedgerService {

    private final CurrentInventoryRepository currentInventoryRepository;
    private final InventoryLogRepository inventoryLogRepository;
    private final ItemLotRepository itemLotRepository;

    public InventoryLedgerServiceImpl(
            CurrentInventoryRepository currentInventoryRepository,
            InventoryLogRepository inventoryLogRepository,
            ItemLotRepository itemLotRepository
    ) {
        this.currentInventoryRepository = currentInventoryRepository;
        this.inventoryLogRepository = inventoryLogRepository;
        this.itemLotRepository = itemLotRepository;
    }

    /**
     * Apply quantity change (positive = IN, negative = OUT) for item/location/lot.
     */
    @Transactional
    public void applyMovement(
            Item item,
            Location location,
            ItemLot lot,
            BigDecimal quantityChange,
            InventoryActionType actionType,
            ReferenceType referenceType,
            Long referenceId,
            UUID userId,
            String note
    ) {
        if (quantityChange.compareTo(BigDecimal.ZERO) == 0) {
            return;
        }

        Long lotId = lot != null ? lot.getId() : null;
        CurrentInventory inv = currentInventoryRepository
                .findByItemLocationLot(item.getId(), location.getId(), lotId)
                .orElseGet(() -> createEmptyInventory(item, location, lot));

        BigDecimal before = inv.getQuantity();
        BigDecimal after = before.add(quantityChange);

        if (after.compareTo(BigDecimal.ZERO) < 0) {
            throw new InsufficientStockException(
                    "Không đủ tồn kho cho sản phẩm " + item.getItemName()
                            + (lot != null ? " (lô " + lot.getLotNumber() + ")" : ""));
        }

        inv.setQuantity(after);
        currentInventoryRepository.save(inv);

        InventoryLog log = InventoryLog.builder()
                .item(item)
                .location(location)
                .lot(lot)
                .userId(userId)
                .referenceType(referenceType)
                .referenceId(referenceId)
                .actionType(actionType)
                .quantityBefore(before)
                .quantityChange(quantityChange)
                .quantityAfter(after)
                .note(note)
                .build();
        inventoryLogRepository.save(log);
    }

    /**
     * FEFO allocation for sales: pick lots earliest expiry first.
     * Returns list of (lot, qty) allocations in base UOM.
     */
    @Transactional(readOnly = true)
    public List<LotAllocation> allocateFefo(Item item, Location location, BigDecimal quantityNeeded) {
        List<LotAllocation> allocations = new ArrayList<>();
        BigDecimal remaining = quantityNeeded;

        List<CurrentInventory> rows = currentInventoryRepository.findByItemId(item.getId()).stream()
                .filter(ci -> ci.getLocation().getId().equals(location.getId()))
                .toList();

        // Lots with expiry first (FEFO), then no-lot rows
        List<CurrentInventory> withLot = rows.stream()
                .filter(ci -> ci.getLot() != null)
                .sorted((a, b) -> {
                    LocalDate ea = a.getLot().getExpiryDate();
                    LocalDate eb = b.getLot().getExpiryDate();
                    if (ea == null && eb == null) return 0;
                    if (ea == null) return 1;
                    if (eb == null) return -1;
                    return ea.compareTo(eb);
                })
                .toList();

        for (CurrentInventory ci : withLot) {
            if (remaining.compareTo(BigDecimal.ZERO) <= 0) break;
            validateLotNotExpired(ci.getLot());
            BigDecimal available = ci.getQuantity().subtract(ci.getReservedQuantity());
            if (available.compareTo(BigDecimal.ZERO) <= 0) continue;
            BigDecimal take = available.min(remaining);
            allocations.add(new LotAllocation(ci.getLot(), take));
            remaining = remaining.subtract(take);
        }

        // Non-lot inventory
        if (remaining.compareTo(BigDecimal.ZERO) > 0) {
            for (CurrentInventory ci : rows.stream().filter(ci -> ci.getLot() == null).toList()) {
                BigDecimal available = ci.getQuantity().subtract(ci.getReservedQuantity());
                if (available.compareTo(BigDecimal.ZERO) <= 0) continue;
                BigDecimal take = available.min(remaining);
                allocations.add(new LotAllocation(null, take));
                remaining = remaining.subtract(take);
                if (remaining.compareTo(BigDecimal.ZERO) <= 0) break;
            }
        }

        if (remaining.compareTo(BigDecimal.ZERO) > 0) {
            throw new InsufficientStockException("Không đủ tồn kho khả dụng cho " + item.getItemName());
        }
        return allocations;
    }

    public void validateLotNotExpired(ItemLot lot) {
        if (lot != null && lot.getExpiryDate() != null && lot.getExpiryDate().isBefore(LocalDate.now())) {
            throw new BadRequestException("Sản phẩm lô " + lot.getLotNumber() + " đã hết hạn sử dụng");
        }
    }

    @Transactional
    public ItemLot getOrCreateLot(Item item, String lotNumber, LocalDate expiryDate) {
        return itemLotRepository.findByItemIdAndLotNumber(item.getId(), lotNumber)
                .orElseGet(() -> itemLotRepository.save(ItemLot.builder()
                        .item(item)
                        .lotNumber(lotNumber)
                        .expiryDate(expiryDate)
                        .build()));
    }

    private CurrentInventory createEmptyInventory(Item item, Location location, ItemLot lot) {
        CurrentInventory ci = CurrentInventory.builder()
                .item(item)
                .location(location)
                .lot(lot)
                .quantity(BigDecimal.ZERO)
                .reservedQuantity(BigDecimal.ZERO)
                .build();
        return currentInventoryRepository.save(ci);
    }

    // record on interface
    // public record LotAllocation(ItemLot lot, BigDecimal quantity) {}
}
