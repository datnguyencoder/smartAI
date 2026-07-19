package com.smartmart.repository;

import com.smartmart.entity.PurchaseOrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.Optional;

@Repository
public interface PurchaseOrderItemRepository extends JpaRepository<PurchaseOrderItem, Long> {
    boolean existsByItemId(Long itemId);

    Optional<PurchaseOrderItem> findFirstByItem_IdOrderByPurchaseOrder_CreatedAtDesc(Long itemId);

    @Query(value = """
            SELECT SUM(poi.received_qty * poi.unit_price) / NULLIF(SUM(poi.received_qty), 0)
            FROM purchase_order_items poi
            JOIN purchase_orders po ON po.id = poi.purchase_id
            WHERE poi.item_id = :itemId
              AND po.status IN ('COMPLETED', 'PARTIALLY_RECEIVED')
              AND poi.received_qty > 0
            """, nativeQuery = true)
    BigDecimal averageReceivedUnitPriceByItemId(@Param("itemId") Long itemId);
}
