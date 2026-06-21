package com.smartmart.service.impl;

import com.smartmart.dto.response.InventoryResponse;
import com.smartmart.entity.CurrentInventory;
import com.smartmart.entity.InventoryLog;
import com.smartmart.enums.InventoryActionType;
import com.smartmart.mapper.WmsResponseMapper;
import com.smartmart.repository.CurrentInventoryRepository;
import com.smartmart.repository.InventoryLogRepository;
import com.smartmart.repository.OrderItemRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Optional;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Transactional(readOnly = true)
public class InventoryQueryServiceImpl implements com.smartmart.service.InventoryQueryService {

    private final CurrentInventoryRepository currentInventoryRepository;
    private final InventoryLogRepository inventoryLogRepository;
    private final OrderItemRepository orderItemRepository;

    public InventoryQueryServiceImpl(
            CurrentInventoryRepository currentInventoryRepository,
            InventoryLogRepository inventoryLogRepository,
            OrderItemRepository orderItemRepository
    ) {
        this.currentInventoryRepository = currentInventoryRepository;
        this.inventoryLogRepository = inventoryLogRepository;
        this.orderItemRepository = orderItemRepository;
    }

    @Override
    public BigDecimal getExactAvailableQty(Long itemId, Long locationId, Long lotId) {
        return currentInventoryRepository.findByItemLocationLot(itemId, locationId, lotId)
                .map(ci -> ci.getQuantity().subtract(ci.getReservedQuantity()))
                .orElse(BigDecimal.ZERO);
    }

    @Override
    public List<CurrentInventory> listAll() {
        return currentInventoryRepository.findAll();
    }

    @Override
    public Page<CurrentInventory> listAllPaginated(Pageable pageable) {
        return currentInventoryRepository.findAll(pageable);
    }

    @Override
    public Map<String, Object> summary() {
        List<CurrentInventory> rows = currentInventoryRepository.findAll();
        BigDecimal totalQuantity = rows.stream()
                .map(CurrentInventory::getQuantity)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalReserved = rows.stream()
                .map(CurrentInventory::getReservedQuantity)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalAvailable = totalQuantity.subtract(totalReserved);
        long outOfStockRows = rows.stream()
                .filter(inv -> inv.getQuantity().subtract(inv.getReservedQuantity()).compareTo(BigDecimal.ZERO) <= 0)
                .count();

        return Map.of(
                "inventoryRows", rows.size(),
                "totalQuantity", totalQuantity,
                "totalReserved", totalReserved,
                "totalAvailable", totalAvailable,
                "lowStockRows", lowStock().size(),
                "outOfStockRows", outOfStockRows,
                "nearExpiryRows", nearExpiry().size()
        );
    }

    @Override
    public List<CurrentInventory> outOfStock() {
        return currentInventoryRepository.findAll().stream()
                .filter(inv -> inv.getQuantity().subtract(inv.getReservedQuantity()).compareTo(BigDecimal.ZERO) <= 0)
                .toList();
    }

    @Override
    public List<CurrentInventory> lowStock() {
        return currentInventoryRepository.findLowStock();
    }

    @Override
    public List<CurrentInventory> nearExpiry() {
        return currentInventoryRepository.findNearExpiry(LocalDate.now().plusDays(30));
    }

    @Override
    public List<InventoryResponse> nearExpiryWithRisk() {
        Map<Long, BigDecimal> avgDailyByItem = new HashMap<>();
        LocalDateTime since = LocalDateTime.now().minusDays(30);
        for (Object[] row : orderItemRepository.sumSalesByItemSince(since)) {
            Long itemId = ((Number) row[0]).longValue();
            BigDecimal totalSold = BigDecimal.valueOf(((Number) row[1]).doubleValue());
            avgDailyByItem.put(itemId, totalSold.divide(BigDecimal.valueOf(30), 4, RoundingMode.HALF_UP));
        }

        LocalDate today = LocalDate.now();
        return nearExpiry().stream()
                .map(inv -> {
                    BigDecimal available = inv.getQuantity().subtract(inv.getReservedQuantity());
                    Integer daysUntilExpiry = null;
                    BigDecimal riskQuantity = null;
                    if (inv.getLot() != null && inv.getLot().getExpiryDate() != null) {
                        daysUntilExpiry = (int) ChronoUnit.DAYS.between(today, inv.getLot().getExpiryDate());
                        BigDecimal avgDaily = avgDailyByItem.getOrDefault(inv.getItem().getId(), BigDecimal.ZERO);
                        BigDecimal expectedSold = avgDaily.multiply(BigDecimal.valueOf(Math.max(daysUntilExpiry, 0)));
                        riskQuantity = available.subtract(expectedSold).max(BigDecimal.ZERO);
                    }
                    return WmsResponseMapper.toInventoryResponse(inv, daysUntilExpiry, riskQuantity);
                })
                .toList();
    }

    @Override
    public Page<InventoryLog> logs(Long itemId, Pageable pageable) {
        if (itemId != null) {
            return inventoryLogRepository.findByItemIdOrderByIdDesc(itemId, pageable);
        }
        return inventoryLogRepository.findAll(pageable);
    }

    @Override
    public Page<InventoryLog> logs(Long itemId, Long locationId, String search, InventoryActionType actionType,
                                   LocalDateTime from, LocalDateTime to, Pageable pageable) {
        LocalDateTime safeFrom = from != null ? from : LocalDateTime.of(2000, 1, 1, 0, 0);
        LocalDateTime safeTo = to != null ? to : LocalDateTime.of(2100, 1, 1, 0, 0);
        return inventoryLogRepository.findFiltered(itemId, locationId, search, actionType, safeFrom, safeTo, pageable);
    }
}
