package com.smartmart.repository;

import com.smartmart.entity.CurrentInventory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.math.BigDecimal;
import java.util.Optional;

public interface CurrentInventoryRepository extends JpaRepository<CurrentInventory, Long> {

    @Query("""
        SELECT COALESCE(SUM(ci.quantity - ci.reservedQuantity), 0)
        FROM CurrentInventory ci WHERE ci.item.id = :itemId
        """)
    Optional<BigDecimal> sumAvailableByItemId(Long itemId);

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
