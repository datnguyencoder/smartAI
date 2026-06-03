package com.smartmart.repository;

import com.smartmart.entity.InventoryLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InventoryLogRepository extends JpaRepository<InventoryLog, Long> {
    Page<InventoryLog> findByItemIdOrderByCreatedAtDesc(Long itemId, Pageable pageable);
}
