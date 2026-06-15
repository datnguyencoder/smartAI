package com.smartmart.service;

import com.smartmart.dto.response.InventoryResponse;
import com.smartmart.entity.CurrentInventory;
import com.smartmart.entity.InventoryLog;
import com.smartmart.enums.InventoryActionType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;

public interface InventoryQueryService {
    List<CurrentInventory> listAll();
    Page<CurrentInventory> listAllPaginated(Pageable pageable);
    List<CurrentInventory> lowStock();

    List<CurrentInventory> nearExpiry();

    List<InventoryResponse> nearExpiryWithRisk();

    Page<InventoryLog> logs(Long itemId, Pageable pageable);

    Page<InventoryLog> logs(Long itemId, Long locationId, String search, InventoryActionType actionType,
                            LocalDateTime from, LocalDateTime to, Pageable pageable);
}
