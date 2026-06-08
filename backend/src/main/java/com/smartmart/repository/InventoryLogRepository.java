package com.smartmart.repository;

import com.smartmart.entity.InventoryLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.data.jpa.repository.Query;
import java.time.LocalDateTime;
import java.util.List;

public interface InventoryLogRepository extends JpaRepository<InventoryLog, Long> {
    Page<InventoryLog> findByItemIdOrderByCreatedAtDesc(Long itemId, Pageable pageable);

    @Query(value = """
        SELECT il.item_id,
               COALESCE(SUM(il.quantity_change) FILTER (WHERE il.action_type = 'PURCHASE_RECEIVE'), 0) as purchased,
               COALESCE(-SUM(il.quantity_change) FILTER (WHERE il.action_type IN ('SALE', 'SALE_CANCEL')), 0) as sold,
               COALESCE(-SUM(il.quantity_change) FILTER (WHERE il.action_type = 'SCRAP'), 0) as scrapped
        FROM inventory_logs il
        WHERE il.created_at >= :from AND il.created_at < :to
        GROUP BY il.item_id
        """, nativeQuery = true)
    List<Object[]> reportMovementByItem(LocalDateTime from, LocalDateTime to);
}
