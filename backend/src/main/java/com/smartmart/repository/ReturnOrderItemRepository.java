package com.smartmart.repository;

import com.smartmart.entity.ReturnOrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;

public interface ReturnOrderItemRepository extends JpaRepository<ReturnOrderItem, Long> {

    @Query("""
        SELECT COALESCE(SUM(ri.quantity), 0)
        FROM ReturnOrderItem ri
        JOIN ri.returnOrder ro
        WHERE ro.originalOrder.id = :originalOrderId
          AND ri.item.id = :itemId
          AND ((:lotId IS NULL AND ri.lot IS NULL) OR (ri.lot.id = :lotId))
        """)
    BigDecimal sumReturnedQty(
            @Param("originalOrderId") Long originalOrderId,
            @Param("itemId") Long itemId,
            @Param("lotId") Long lotId
    );
}
