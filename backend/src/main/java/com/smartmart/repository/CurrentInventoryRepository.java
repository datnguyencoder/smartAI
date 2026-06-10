package com.smartmart.repository;

import com.smartmart.entity.CurrentInventory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.List;
import java.math.BigDecimal;
import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;

public interface CurrentInventoryRepository extends JpaRepository<CurrentInventory, Long> {

    @Override
    @EntityGraph(attributePaths = {"item", "location", "lot"})
    List<CurrentInventory> findAll();

    @Query("SELECT ci FROM CurrentInventory ci " +
           "WHERE (:itemId IS NULL OR ci.item.id = :itemId) " +
           "AND (:locationId IS NULL OR ci.location.id = :locationId) " +
           "AND (:lotId IS NULL OR ci.lot.id = :lotId)")
    @EntityGraph(attributePaths = {"item", "location", "lot"})
    List<CurrentInventory> findFiltered(@Param("itemId") Long itemId, @Param("locationId") Long locationId, @Param("lotId") Long lotId);

    @Query("""
        SELECT COALESCE(SUM(ci.quantity - ci.reservedQuantity), 0)
        FROM CurrentInventory ci WHERE ci.item.id = :itemId
        """)
    Optional<BigDecimal> sumAvailableByItemId(Long itemId);

    @Query("""
        SELECT COALESCE(SUM(ci.quantity), 0)
        FROM CurrentInventory ci WHERE ci.item.id = :itemId
        """)
    BigDecimal sumQuantityByItemId(Long itemId);


    @Query("""
        SELECT ci FROM CurrentInventory ci
        WHERE ci.item.id = :itemId AND ci.location.id = :locationId
        AND ((:lotId IS NULL AND ci.lot IS NULL) OR (ci.lot.id = :lotId))
        """)
    Optional<CurrentInventory> findByItemLocationLot(Long itemId, Long locationId, Long lotId);

    List<CurrentInventory> findByItemId(Long itemId);

    List<CurrentInventory> findByLocationId(Long locationId);

    @Query("""
        SELECT ci FROM CurrentInventory ci
        JOIN ci.item i
        WHERE ci.quantity - ci.reservedQuantity < i.minimumStock
        """)
    List<CurrentInventory> findLowStock();

    @Query("""
        SELECT ci FROM CurrentInventory ci
        JOIN ci.lot l
        WHERE l.expiryDate IS NOT NULL AND l.expiryDate <= :deadline
        """)
    List<CurrentInventory> findNearExpiry(@Param("deadline") LocalDate deadline);

    @Query(value = """
        SELECT i.id as item_id,
               i.item_code,
               i.item_name,
               c.category_name,
               COALESCE(inv.total_stock, 0) as current_stock,
               COALESCE(mov.purchased, 0) as total_purchased,
               COALESCE(mov.sold, 0) as total_sold,
               COALESCE(mov.scrapped, 0) as total_scrapped,
               COALESCE(mov.shrinkage, 0) as shrinkage,
               lot.nearest_expiry
        FROM items i
        LEFT JOIN categories c ON c.id = i.category_id
        LEFT JOIN (
            SELECT item_id, SUM(quantity) as total_stock
            FROM current_inventory
            GROUP BY item_id
        ) inv ON inv.item_id = i.id
        LEFT JOIN (
            SELECT il.item_id,
                   COALESCE(SUM(CASE WHEN il.action_type = 'PURCHASE_RECEIVE' THEN il.quantity_change ELSE 0 END), 0) as purchased,
                   COALESCE(SUM(CASE WHEN il.action_type IN ('SALE', 'SALE_CANCEL') THEN -il.quantity_change ELSE 0 END), 0) as sold,
                   COALESCE(SUM(CASE WHEN il.action_type = 'SCRAP' THEN -il.quantity_change ELSE 0 END), 0) as scrapped,
                   COALESCE(SUM(CASE WHEN il.action_type = 'ADJUSTMENT' THEN -il.quantity_change ELSE 0 END), 0) as shrinkage
            FROM inventory_logs il
            WHERE il.created_at >= :from AND il.created_at < :to
            GROUP BY il.item_id
        ) mov ON mov.item_id = i.id
        LEFT JOIN (
            SELECT item_id, MIN(expiry_date) as nearest_expiry
            FROM item_lots
            WHERE expiry_date >= CURRENT_DATE
            GROUP BY item_id
        ) lot ON lot.item_id = i.id
        ORDER BY i.item_name
        """, nativeQuery = true)
    List<Object[]> reportInventoryDetails(LocalDateTime from, LocalDateTime to);
}
