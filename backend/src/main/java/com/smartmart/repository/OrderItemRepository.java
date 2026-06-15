package com.smartmart.repository;

import com.smartmart.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.List;

public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

    @Query("""
        SELECT oi.item.id, COALESCE(SUM(oi.quantity), 0)
        FROM OrderItem oi
        JOIN oi.order o
        WHERE o.status = com.smartmart.enums.OrderStatus.COMPLETED
        GROUP BY oi.item.id
        """)
    List<Object[]> aggregateSoldByItem();

    boolean existsByItemId(Long itemId);

    @Query("""
        SELECT oi.item.id, COALESCE(SUM(oi.quantity), 0)
        FROM OrderItem oi
        JOIN oi.order o
        WHERE o.status = com.smartmart.enums.OrderStatus.COMPLETED
          AND o.orderDate >= :since
        GROUP BY oi.item.id
        """)
    List<Object[]> sumSalesByItemSince(LocalDateTime since);

    @Query(value = """
        SELECT CAST(sub.item_id AS BIGINT), MAX(sub.daily_qty)
        FROM (
            SELECT oi.item_id, CAST(o.order_date AS DATE) AS sale_day, SUM(oi.quantity) AS daily_qty
            FROM order_items oi
            JOIN orders o ON o.id = oi.order_id
            WHERE o.status = 'COMPLETED' AND o.order_date >= :since
            GROUP BY oi.item_id, CAST(o.order_date AS DATE)
        ) sub
        GROUP BY sub.item_id
        """, nativeQuery = true)
    List<Object[]> maxDailySalesByItemSince(LocalDateTime since);
}
