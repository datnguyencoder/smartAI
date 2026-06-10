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
            AND (:locationId IS NULL OR po.location.id = :locationId)
            AND (:status IS NULL OR po.status = :status)
            AND (:search IS NULL OR :search = '' OR str(po.id) LIKE CONCAT('%', :search, '%') OR LOWER(po.supplier.supplierName) LIKE LOWER(CONCAT('%', :search, '%')))
            AND (po.createdAt >= :fromDate)
            AND (po.createdAt < :toDate)
            """)
    Page<Long> findFilteredIdsPaged(@org.springframework.data.repository.query.Param("supplierId") Long supplierId, 
                                    @org.springframework.data.repository.query.Param("locationId") Long locationId, 
                                    @org.springframework.data.repository.query.Param("search") String search,
                                    @org.springframework.data.repository.query.Param("status") com.smartmart.enums.PurchaseStatus status,
                                    @org.springframework.data.repository.query.Param("fromDate") java.time.LocalDateTime fromDate, 
                                    @org.springframework.data.repository.query.Param("toDate") java.time.LocalDateTime toDate,
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
