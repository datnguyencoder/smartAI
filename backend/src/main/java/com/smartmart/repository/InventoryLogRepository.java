package com.smartmart.repository;

import com.smartmart.entity.InventoryLog;
import com.smartmart.enums.InventoryActionType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;

import com.smartmart.enums.ReferenceType;

public interface InventoryLogRepository extends JpaRepository<InventoryLog, Long> {
    Page<InventoryLog> findByItemIdOrderByIdDesc(Long itemId, Pageable pageable);

    @Query("SELECT l FROM InventoryLog l WHERE l.referenceType = :refType AND l.referenceId = :refId AND l.item.id = :itemId AND ((l.lot IS NULL AND :lotId IS NULL) OR (l.lot.id = :lotId))")
    java.util.Optional<InventoryLog> findLogForUpdate(@Param("refType") ReferenceType refType, @Param("refId") Long refId, @Param("itemId") Long itemId, @Param("lotId") Long lotId);

    void deleteByReferenceTypeAndReferenceId(ReferenceType refType, Long refId);

    @Query("SELECT l FROM InventoryLog l " +
           "WHERE (:itemId IS NULL OR l.item.id = :itemId) " +
           "AND (:locationId IS NULL OR l.location.id = :locationId) " +
           "AND (:actionType IS NULL OR l.actionType = :actionType) " +
           "AND (:search IS NULL OR :search = '' OR LOWER(l.item.itemName) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(l.location.locationName) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "AND (l.createdAt >= :fromDate) " +
           "AND (l.createdAt < :toDate) ")
    Page<InventoryLog> findFiltered(
            @Param("itemId") Long itemId,
            @Param("locationId") Long locationId,
            @Param("search") String search,
            @Param("actionType") InventoryActionType actionType,
            @Param("fromDate") LocalDateTime fromDate,
            @Param("toDate") LocalDateTime toDate,
            Pageable pageable);
}
