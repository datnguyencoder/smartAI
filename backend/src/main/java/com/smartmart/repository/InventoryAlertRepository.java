package com.smartmart.repository;

import com.smartmart.entity.InventoryAlert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface InventoryAlertRepository extends JpaRepository<InventoryAlert, Long> {

    Optional<InventoryAlert> findFirstByItemIdAndAlertTypeAndResolvedFalse(Long itemId, String alertType);

    @Query("""
        SELECT a FROM InventoryAlert a
        JOIN FETCH a.item
        WHERE a.resolved = false
        ORDER BY a.createdAt DESC
        """)
    List<InventoryAlert> findByResolvedFalseOrderByCreatedAtDesc();
}
