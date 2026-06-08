package com.smartmart.service;

import com.smartmart.entity.CurrentInventory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface CurrentInventoryService {
    List<CurrentInventory> listAll(Long itemId, Long locationId, Long lotId);
    Page<CurrentInventory> listAllPaginated(Pageable pageable);
}
