package com.smartmart.repository;

import com.smartmart.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

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
}
