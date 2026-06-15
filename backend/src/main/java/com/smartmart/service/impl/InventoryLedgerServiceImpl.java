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

@Service
public class InventoryLedgerServiceImpl implements com.smartmart.service.InventoryLedgerService {

    private final CurrentInventoryRepository currentInventoryRepository;
    private final InventoryLogRepository inventoryLogRepository;
    private final ItemLotRepository itemLotRepository;

    public InventoryLedgerServiceImpl(
            CurrentInventoryRepository currentInventoryRepository,
            InventoryLogRepository inventoryLogRepository,
            ItemLotRepository itemLotRepository) {
        this.currentInventoryRepository = currentInventoryRepository;
        this.inventoryLogRepository = inventoryLogRepository;
        this.itemLotRepository = itemLotRepository;
    }

    @Transactional
    public void applyMovement(
            Item item,
            Location location,
            ItemLot lot,
            BigDecimal quantityChange,
            InventoryActionType actionType,
            ReferenceType referenceType,
            Long referenceId,
            Long userId,
            String note) {
        if (quantityChange.compareTo(BigDecimal.ZERO) == 0) {
            return;
        }

        Long lotId = lot != null ? lot.getId() : null;
        CurrentInventory inv = currentInventoryRepository
                .findByItemLocationLot(item.getId(), location.getId(), lotId)
                .orElseGet(() -> createEmptyInventory(item, location, lot));

        BigDecimal lotBefore = inv.getQuantity();
        BigDecimal lotAfter = lotBefore.add(quantityChange);

        if (lotAfter.compareTo(BigDecimal.ZERO) < 0) {
            throw new InsufficientStockException(
                    "Không đủ tồn kho cho sản phẩm " + item.getItemName()
                            + (lot != null ? " (lô " + lot.getLotNumber() + ")" : ""));
        }

        inv.setQuantity(lotAfter);
        inv = currentInventoryRepository.save(inv);
        final Long savedInvId = inv.getId();

        BigDecimal totalBefore = currentInventoryRepository.findByItemId(item.getId()).stream()
                .filter(ci -> ci.getLocation().getId().equals(location.getId()))
                .filter(ci -> !ci.getId().equals(savedInvId))
                .map(CurrentInventory::getQuantity)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .add(lotBefore);

        BigDecimal totalAfter = totalBefore.add(quantityChange);

        InventoryLog log = InventoryLog.builder()
                .item(item)
                .location(location)
                .lot(lot)
                .userId(userId)
                .referenceType(referenceType)
                .referenceId(referenceId)
                .actionType(actionType)
                .quantityBefore(totalBefore)
                .quantityChange(quantityChange)
                .quantityAfter(totalAfter)
                .note(note)
                .build();
        inventoryLogRepository.save(log);
    }

    @Transactional
    public void logActionOnly(
            Item item,
            Location location,
            ItemLot lot,
            InventoryActionType actionType,
            ReferenceType referenceType,
            Long referenceId,
            Long userId,
            String note) {
        BigDecimal totalBefore = currentInventoryRepository.findByItemId(item.getId()).stream()
                .filter(ci -> ci.getLocation().getId().equals(location.getId()))
                .map(CurrentInventory::getQuantity)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        InventoryLog log = InventoryLog.builder()
                .item(item)
                .location(location)
                .lot(lot)
                .userId(userId)
                .referenceType(referenceType)
                .referenceId(referenceId)
                .actionType(actionType)
                .quantityBefore(totalBefore)
                .quantityChange(BigDecimal.ZERO)
                .quantityAfter(totalBefore)
                .note(note)
                .build();
        inventoryLogRepository.save(log);
    }

    // Xuất bán: phân bổ lô FEFO (hạn dùng sớm trước), rồi tồn không lô
    @Transactional
    public List<LotAllocation> allocateFefo(Item item, Location location, BigDecimal quantityNeeded) {
        List<LotAllocation> allocations = new ArrayList<>();
        BigDecimal remaining = quantityNeeded;

        List<CurrentInventory> rows = currentInventoryRepository.findAvailableInventoryForUpdate(item.getId(), location.getId());

        for (CurrentInventory ci : rows) {
            if (remaining.compareTo(BigDecimal.ZERO) <= 0)
                break;
            BigDecimal available = ci.getQuantity().subtract(ci.getReservedQuantity());
            if (available.compareTo(BigDecimal.ZERO) <= 0)
                continue;
            BigDecimal take = available.min(remaining);
            allocations.add(new LotAllocation(ci.getLot(), take));
            remaining = remaining.subtract(take);
        }

        if (remaining.compareTo(BigDecimal.ZERO) > 0) {
            throw new InsufficientStockException("Không đủ tồn kho khả dụng cho " + item.getItemName());
        }
        return allocations;
    }

    @Transactional
    public List<GlobalLotAllocation> allocateGlobalFefo(Item item, BigDecimal quantityNeeded) {
        List<GlobalLotAllocation> allocations = new ArrayList<>();
        BigDecimal remaining = quantityNeeded;

        List<CurrentInventory> rows = currentInventoryRepository.findGlobalAvailableInventoryForUpdate(item.getId());

        for (CurrentInventory ci : rows) {
            if (remaining.compareTo(BigDecimal.ZERO) <= 0)
                break;
            BigDecimal available = ci.getQuantity().subtract(ci.getReservedQuantity());
            if (available.compareTo(BigDecimal.ZERO) <= 0)
                continue;
            BigDecimal take = available.min(remaining);
            allocations.add(new GlobalLotAllocation(ci.getLot(), ci.getLocation(), take));
            remaining = remaining.subtract(take);
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

    @Override
    @Transactional
    public void applyMovementAndUpdateLog(
            Item item,
            Location location,
            ItemLot lot,
            BigDecimal quantityChange,
            InventoryActionType actionType,
            ReferenceType referenceType,
            Long referenceId,
            Long userId,
            String note) {

        if (quantityChange.compareTo(BigDecimal.ZERO) == 0) {
            return;
        }

        Long lotId = lot != null ? lot.getId() : null;
        CurrentInventory inv = currentInventoryRepository
                .findByItemLocationLot(item.getId(), location.getId(), lotId)
                .orElseGet(() -> createEmptyInventory(item, location, lot));

        BigDecimal lotBefore = inv.getQuantity();
        BigDecimal lotAfter = lotBefore.add(quantityChange);

        if (lotAfter.compareTo(BigDecimal.ZERO) < 0) {
            throw new InsufficientStockException(
                    "Không đủ tồn kho cho sản phẩm " + item.getItemName()
                            + (lot != null ? " (lô " + lot.getLotNumber() + ")" : ""));
        }

        inv.setQuantity(lotAfter);
        inv = currentInventoryRepository.save(inv);
        final Long savedInvId = inv.getId();

        BigDecimal totalBefore = currentInventoryRepository.findByItemId(item.getId()).stream()
                .filter(ci -> ci.getLocation().getId().equals(location.getId()))
                .filter(ci -> !ci.getId().equals(savedInvId))
                .map(CurrentInventory::getQuantity)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .add(lotBefore);

        BigDecimal totalAfter = totalBefore.add(quantityChange);

        InventoryLog log = inventoryLogRepository.findLogForUpdate(referenceType, referenceId, item.getId(), lotId)
                .orElseGet(() -> InventoryLog.builder()
                        .item(item)
                        .location(location)
                        .lot(lot)
                        .referenceType(referenceType)
                        .referenceId(referenceId)
                        .build());
                        
        log.setUserId(userId);
        log.setActionType(actionType);
        log.setQuantityBefore(totalBefore);
        log.setQuantityChange(quantityChange);
        log.setQuantityAfter(totalAfter);
        log.setNote(note);
        
        inventoryLogRepository.save(log);
    }

    @Override
    @Transactional
    public void deleteLogsByReference(ReferenceType refType, Long refId) {
        inventoryLogRepository.deleteByReferenceTypeAndReferenceId(refType, refId);
    }

    @Override
    @Transactional
    public void applyTransfer(
            Item item,
            ItemLot lot,
            Location fromLocation,
            Location toLocation,
            BigDecimal quantity,
            ReferenceType referenceType,
            Long referenceId,
            Long userId,
            String note
    ) {
        applyMovement(
                item, fromLocation, lot, quantity.negate(),
                InventoryActionType.TRANSFER_OUT, referenceType, referenceId, userId, note
        );
        applyMovement(
                item, toLocation, lot, quantity,
                InventoryActionType.TRANSFER_IN, referenceType, referenceId, userId, note
        );
    }
}
