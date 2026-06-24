package com.smartmart.repository;

import com.smartmart.entity.InventoryLog;
import com.smartmart.enums.InventoryActionType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;

import com.smartmart.enums.ReferenceType;

import java.util.List;
import java.util.Optional;

public interface InventoryLogRepository extends JpaRepository<InventoryLog, Long> {
        @EntityGraph(attributePaths = {"item", "location"})
        Page<InventoryLog> findByItemIdOrderByIdDesc(Long itemId, Pageable pageable);

        @Query("SELECT l FROM InventoryLog l WHERE l.referenceType = :refType AND l.referenceId = :refId AND l.item.id = :itemId AND ((l.lot IS NULL AND :lotId IS NULL) OR (l.lot.id = :lotId))")
        Optional<InventoryLog> findLogForUpdate(@Param("refType") ReferenceType refType,
                        @Param("refId") Long refId, @Param("itemId") Long itemId, @Param("lotId") Long lotId);

        void deleteByReferenceTypeAndReferenceId(ReferenceType refType, Long refId);

        @Query("SELECT l FROM InventoryLog l " +
                        "WHERE (:itemId IS NULL OR l.item.id = :itemId) " +
                        "AND (:locationId IS NULL OR l.location.id = :locationId) " +
                        "AND (:actionType IS NULL OR l.actionType = :actionType) " +
                        "AND (:search IS NULL OR :search = '' OR LOWER(l.item.itemName) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(l.location.locationName) LIKE LOWER(CONCAT('%', :search, '%'))) "
                        +
                        "AND (l.createdAt >= :fromDate) " +
                        "AND (l.createdAt < :toDate) ")
        @EntityGraph(attributePaths = {"item", "location"})
        Page<InventoryLog> findFiltered(
                        @Param("itemId") Long itemId,
                        @Param("locationId") Long locationId,
                        @Param("search") String search,
                        @Param("actionType") InventoryActionType actionType,
                        @Param("fromDate") LocalDateTime fromDate,
                        @Param("toDate") LocalDateTime toDate,
                        Pageable pageable);

        @EntityGraph(attributePaths = {"item", "location"})
        Page<InventoryLog> findByItemIdOrderByCreatedAtDesc(Long itemId, Pageable pageable);

        @Modifying
        @Query("UPDATE InventoryLog l SET l.referenceId = :orderId WHERE l.referenceType = 'ORDER' AND l.referenceId IS NULL AND l.actionType = 'SALE' AND l.item.id IN :itemIds AND l.userId = :userId AND l.createdAt >= :since")
        void backfillSaleReferenceId(@Param("orderId") Long orderId, @Param("itemIds") List<Long> itemIds,
                        @Param("userId") Long userId, @Param("since") LocalDateTime since);

        @Query(value = """
                        SELECT il.item_id,
                               COALESCE(SUM(il.quantity_change) FILTER (WHERE il.action_type = 'PURCHASE_RECEIVE'), 0) as purchased,
                               COALESCE(-SUM(il.quantity_change) FILTER (WHERE il.action_type IN ('SALE', 'SALE_CANCEL')), 0) as sold,
                               COALESCE(-SUM(il.quantity_change) FILTER (WHERE il.action_type IN ('SCRAP', 'SCRAP_COMPLETED')), 0) as scrapped
                        FROM inventory_logs il
                        WHERE il.created_at >= :from AND il.created_at < :to
                        GROUP BY il.item_id
                        """, nativeQuery = true)
        List<Object[]> reportMovementByItem(LocalDateTime from, LocalDateTime to);
}
