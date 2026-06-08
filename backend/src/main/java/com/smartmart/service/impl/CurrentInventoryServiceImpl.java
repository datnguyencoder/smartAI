package com.smartmart.service.impl;

import com.smartmart.entity.CurrentInventory;
import com.smartmart.repository.CurrentInventoryRepository;
import com.smartmart.service.CurrentInventoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class CurrentInventoryServiceImpl implements CurrentInventoryService {

    private final CurrentInventoryRepository currentInventoryRepository;

    @Override
    public List<CurrentInventory> listAll(Long itemId, Long locationId, Long lotId) {
        return currentInventoryRepository.findFiltered(itemId, locationId, lotId);
    }

    @Override
    public Page<CurrentInventory> listAllPaginated(Pageable pageable) {
        return currentInventoryRepository.findAll(pageable);
    }
}
