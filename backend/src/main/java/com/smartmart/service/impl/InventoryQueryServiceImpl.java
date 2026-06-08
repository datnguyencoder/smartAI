package com.smartmart.service.impl;

import com.smartmart.entity.CurrentInventory;
import com.smartmart.entity.InventoryLog;
import com.smartmart.repository.CurrentInventoryRepository;
import com.smartmart.repository.InventoryLogRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
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
            return inventoryLogRepository.findByItemIdOrderByCreatedAtDesc(itemId, pageable);
        }
        return inventoryLogRepository.findAll(pageable);
    }
}
