package com.smartmart.repository;

import com.smartmart.entity.InventoryAlert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface InventoryAlertRepository extends JpaRepository<InventoryAlert, Long> {

    Optional<InventoryAlert> findFirstByItemIdAndAlertTypeAndResolvedFalse(Long itemId, String alertType);

    List<InventoryAlert> findByItemIdAndAlertTypeAndResolvedFalse(Long itemId, String alertType);

    @Query("""
        SELECT COUNT(a) > 0 FROM InventoryAlert a
        WHERE a.item.id = :itemId AND a.alertType IN :types AND a.resolved = false
        """)
    boolean existsByItemIdAndAlertTypeInAndResolvedFalse(
            @Param("itemId") Long itemId,
            @Param("types") List<String> types
    );

    @Query("""
        SELECT a FROM InventoryAlert a
        JOIN FETCH a.item
        WHERE a.resolved = false
        ORDER BY a.createdAt DESC
        """)
    List<InventoryAlert> findByResolvedFalseOrderByCreatedAtDesc();

    long countByResolvedFalse();
}
