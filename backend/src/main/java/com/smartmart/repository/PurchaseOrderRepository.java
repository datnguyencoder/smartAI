package com.smartmart.repository;

import com.smartmart.entity.PurchaseOrder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface PurchaseOrderRepository extends JpaRepository<PurchaseOrder, Long> {

    @Query("""
            SELECT DISTINCT po FROM PurchaseOrder po
            LEFT JOIN FETCH po.supplier
            LEFT JOIN FETCH po.location
            LEFT JOIN FETCH po.items items
            LEFT JOIN FETCH items.item
            ORDER BY po.purchaseDate DESC
            """)
    List<PurchaseOrder> findAllWithDetails();

    @Query("""
            SELECT po.id FROM PurchaseOrder po
            WHERE (:supplierId IS NULL OR po.supplier.id = :supplierId)
            AND (:status IS NULL OR po.status = :status)
            AND (cast(:fromDate as java.time.LocalDateTime) IS NULL OR po.createdAt >= :fromDate)
            AND (cast(:toDate as java.time.LocalDateTime) IS NULL OR po.createdAt <= :toDate)
            ORDER BY po.createdAt DESC
            """)
    Page<Long> findFilteredIdsPaged(Long supplierId, com.smartmart.enums.PurchaseStatus status,
                                    java.time.LocalDateTime fromDate, java.time.LocalDateTime toDate,
                                    Pageable pageable);

    @Query("""
            SELECT DISTINCT po FROM PurchaseOrder po
            LEFT JOIN FETCH po.supplier
            LEFT JOIN FETCH po.location
            LEFT JOIN FETCH po.items items
            LEFT JOIN FETCH items.item
            WHERE po.id IN :ids
            ORDER BY po.createdAt DESC
            """)
    List<PurchaseOrder> findByIdsWithDetails(List<Long> ids);

    @Query("""
            SELECT po FROM PurchaseOrder po
            LEFT JOIN FETCH po.supplier
            LEFT JOIN FETCH po.location
            LEFT JOIN FETCH po.items items
            LEFT JOIN FETCH items.item
            WHERE po.id = :id
            """)
    Optional<PurchaseOrder> findByIdWithDetails(Long id);
}
