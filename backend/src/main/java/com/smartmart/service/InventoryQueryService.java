package com.smartmart.service;

import com.smartmart.entity.CurrentInventory;
import com.smartmart.entity.InventoryLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface InventoryQueryService {

    List<CurrentInventory> listAll();

    List<CurrentInventory> lowStock();

    List<CurrentInventory> nearExpiry();

    Page<InventoryLog> logs(Long itemId, Pageable pageable);
}
