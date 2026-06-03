package com.smartmart.repository;

import com.smartmart.entity.PurchaseOrder;
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
            SELECT po FROM PurchaseOrder po
            LEFT JOIN FETCH po.supplier
            LEFT JOIN FETCH po.location
            LEFT JOIN FETCH po.items items
            LEFT JOIN FETCH items.item
            WHERE po.id = :id
            """)
    Optional<PurchaseOrder> findByIdWithDetails(Long id);
}
