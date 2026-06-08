package com.smartmart.repository;

import com.smartmart.entity.CurrentInventory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

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
}
