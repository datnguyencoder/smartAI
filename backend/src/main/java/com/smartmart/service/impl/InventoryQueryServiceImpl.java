package com.smartmart.service.impl;

import com.smartmart.entity.CurrentInventory;
import com.smartmart.entity.InventoryLog;
import com.smartmart.enums.InventoryActionType;
import com.smartmart.repository.CurrentInventoryRepository;
import com.smartmart.repository.InventoryLogRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class InventoryQueryServiceImpl implements com.smartmart.service.InventoryQueryService {

    private final CurrentInventoryRepository currentInventoryRepository;
    private final InventoryLogRepository inventoryLogRepository;

    public InventoryQueryServiceImpl(
            CurrentInventoryRepository currentInventoryRepository,
            InventoryLogRepository inventoryLogRepository
    ) {
        this.currentInventoryRepository = currentInventoryRepository;
        this.inventoryLogRepository = inventoryLogRepository;
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
    public List<CurrentInventory> lowStock() {
        return currentInventoryRepository.findLowStock();
    }

    @Override
    public List<CurrentInventory> nearExpiry() {
        return currentInventoryRepository.findNearExpiry(LocalDate.now().plusDays(30));
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
