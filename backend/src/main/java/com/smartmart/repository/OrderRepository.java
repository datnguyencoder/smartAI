package com.smartmart.repository;

import com.smartmart.entity.Order;
import com.smartmart.enums.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long> {
    Optional<Order> findByOrderCode(String orderCode);

    boolean existsByOrderCodeStartingWith(String prefix);

    @Query("""
        SELECT o FROM Order o
        LEFT JOIN FETCH o.items oi
        LEFT JOIN FETCH oi.item
        WHERE o.status = :status AND o.orderDate >= :since
        ORDER BY o.orderDate DESC
        """)
    List<Order> findCompletedSince(OrderStatus status, LocalDateTime since);

    @Query(value = """
        SELECT CAST(oi.item_id AS BIGINT) as item_id,
               CAST(o.order_date AS DATE) as sale_date,
               SUM(oi.quantity) as quantity,
               MAX(i.category_id) as category_id
        FROM orders o
        JOIN order_items oi ON oi.order_id = o.id
        JOIN items i ON i.id = oi.item_id
        WHERE o.status = 'COMPLETED' AND o.order_date >= :since
        GROUP BY oi.item_id, CAST(o.order_date AS DATE)
        ORDER BY sale_date
        """, nativeQuery = true)
    List<Object[]> aggregateDailySalesSince(LocalDateTime since);
}
