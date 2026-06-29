package com.smartmart.service.impl;

import com.smartmart.dto.request.CreateStockAdjustmentRequest;
import com.smartmart.dto.request.CreateStockTransferRequest;
import com.smartmart.dto.response.StockMovementResponse;
import com.smartmart.entity.CurrentInventory;
import com.smartmart.entity.Item;
import com.smartmart.entity.ItemLot;
import com.smartmart.entity.Location;
import com.smartmart.enums.InventoryActionType;
import com.smartmart.enums.ReferenceType;
import com.smartmart.exception.BadRequestException;
import com.smartmart.repository.CurrentInventoryRepository;
import com.smartmart.repository.ItemLotRepository;
import com.smartmart.repository.LocationRepository;
import com.smartmart.security.SecurityUtils;
import com.smartmart.service.InventoryLedgerService;
import com.smartmart.service.ItemService;
import com.smartmart.service.StockMovementService;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Service
public class StockMovementServiceImpl implements StockMovementService {

    private final ItemService itemService;
    private final LocationRepository locationRepository;
    private final ItemLotRepository itemLotRepository;
    private final CurrentInventoryRepository currentInventoryRepository;
    private final InventoryLedgerService inventoryLedgerService;

    public StockMovementServiceImpl(
            ItemService itemService,
            LocationRepository locationRepository,
            ItemLotRepository itemLotRepository,
            CurrentInventoryRepository currentInventoryRepository,
            InventoryLedgerService inventoryLedgerService) {
        this.itemService = itemService;
        this.locationRepository = locationRepository;
        this.itemLotRepository = itemLotRepository;
        this.currentInventoryRepository = currentInventoryRepository;
        this.inventoryLedgerService = inventoryLedgerService;
    }

    @Override
    @Transactional
    @CacheEvict(value = {"items", "itemsPage", "dashboardSummary"}, allEntries = true)
    public StockMovementResponse adjust(CreateStockAdjustmentRequest request) {
        Item item = itemService.findItem(request.getItemId());
        Location location = findLocation(request.getLocationId());
        ItemLot lot = findLot(request.getLotId());

        BigDecimal before = currentInventoryRepository
                .findByItemLocationLot(item.getId(), location.getId(), lot != null ? lot.getId() : null)
                .map(CurrentInventory::getQuantity)
                .orElse(BigDecimal.ZERO);

        BigDecimal change = request.getQuantityChange();
        if (change == null) {
            if (request.getActualQuantity() == null) {
                throw new BadRequestException("Cần nhập tồn thực tế hoặc số lượng điều chỉnh");
            }
            change = request.getActualQuantity().subtract(before);
        }
        if (change.compareTo(BigDecimal.ZERO) == 0) {
            throw new BadRequestException("Số lượng điều chỉnh phải khác 0");
        }

        String note = normalizeNote(request.getNote(), "Điều chỉnh tồn kho");
        inventoryLedgerService.applyMovement(
                item,
                location,
                lot,
                change,
                InventoryActionType.ADJUSTMENT,
                ReferenceType.STOCK_ADJUSTMENT,
                null,
                SecurityUtils.getCurrentUserId().orElse(null),
                note
        );

        return StockMovementResponse.builder()
                .itemId(item.getId())
                .itemName(item.getItemName())
                .locationId(location.getId())
                .locationName(location.getLocationName())
                .lotId(lot != null ? lot.getId() : null)
                .lotNumber(lot != null ? lot.getLotNumber() : null)
                .actionType(InventoryActionType.ADJUSTMENT)
                .quantity(change)
                .quantityBefore(before)
                .quantityAfter(before.add(change))
                .note(note)
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Override
    @Transactional
    @CacheEvict(value = {"items", "itemsPage", "dashboardSummary"}, allEntries = true)
    public StockMovementResponse transfer(CreateStockTransferRequest request) {
        if (request.getFromLocationId().equals(request.getToLocationId())) {
            throw new BadRequestException("Kho nguồn và kho đích phải khác nhau");
        }

        Item item = itemService.findItem(request.getItemId());
        Location fromLocation = findLocation(request.getFromLocationId());
        Location toLocation = findLocation(request.getToLocationId());
        ItemLot lot = findLot(request.getLotId());

        BigDecimal before = currentInventoryRepository
                .findByItemLocationLot(item.getId(), fromLocation.getId(), lot != null ? lot.getId() : null)
                .map(CurrentInventory::getQuantity)
                .orElse(BigDecimal.ZERO);
        String note = normalizeNote(request.getNote(), "Điều chuyển kho");
        Long userId = SecurityUtils.getCurrentUserId().orElse(null);

        inventoryLedgerService.applyMovement(
                item,
                fromLocation,
                lot,
                request.getQuantity().negate(),
                InventoryActionType.TRANSFER_OUT,
                ReferenceType.TRANSFER_ORDER,
                null,
                userId,
                note
        );
        inventoryLedgerService.applyMovement(
                item,
                toLocation,
                lot,
                request.getQuantity(),
                InventoryActionType.TRANSFER_IN,
                ReferenceType.TRANSFER_ORDER,
                null,
                userId,
                note
        );

        return StockMovementResponse.builder()
                .itemId(item.getId())
                .itemName(item.getItemName())
                .fromLocationId(fromLocation.getId())
                .fromLocationName(fromLocation.getLocationName())
                .toLocationId(toLocation.getId())
                .toLocationName(toLocation.getLocationName())
                .lotId(lot != null ? lot.getId() : null)
                .lotNumber(lot != null ? lot.getLotNumber() : null)
                .actionType(InventoryActionType.TRANSFER_OUT)
                .quantity(request.getQuantity())
                .quantityBefore(before)
                .quantityAfter(before.subtract(request.getQuantity()))
                .note(note)
                .createdAt(LocalDateTime.now())
                .build();
    }

    private Location findLocation(Long id) {
        Location location = locationRepository.findById(id)
                .orElseThrow(() -> new BadRequestException("Không tìm thấy vị trí kho: " + id));
        if (!location.isActive()) {
            throw new BadRequestException("Vị trí kho không hoạt động: " + location.getLocationName());
        }
        return location;
    }

    private ItemLot findLot(Long id) {
        if (id == null) return null;
        return itemLotRepository.findById(id)
                .orElseThrow(() -> new BadRequestException("Không tìm thấy lô hàng: " + id));
    }

    private String normalizeNote(String note, String fallback) {
        if (note == null || note.isBlank()) return fallback;
        return note.trim();
    }
}
