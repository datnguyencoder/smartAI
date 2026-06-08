package com.smartmart.repository;

import com.smartmart.entity.Order;
import com.smartmart.enums.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

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

    @Query("""
        SELECT o FROM Order o
        LEFT JOIN FETCH o.items oi
        LEFT JOIN FETCH oi.item
        WHERE o.id = :id
        """)
    Optional<Order> findByIdWithItems(Long id);

    @Query("""
        SELECT o FROM Order o
        LEFT JOIN FETCH o.items oi
        LEFT JOIN FETCH oi.item
        ORDER BY o.orderDate DESC
        """)
    List<Order> findAllWithItems();

    @Query("""
        SELECT o FROM Order o
        LEFT JOIN FETCH o.items oi
        LEFT JOIN FETCH oi.item
        WHERE o.createdBy = :createdBy
        ORDER BY o.orderDate DESC
        """)
    List<Order> findByCreatedByWithItems(UUID createdBy);

    @Query(value = """
        SELECT TO_CHAR(o.order_date, 'YYYY-MM-DD') as period,
               COUNT(DISTINCT o.id) as total_orders,
               COUNT(DISTINCT o.id) FILTER (WHERE o.status = 'CANCELLED') as cancelled_orders,
               COALESCE(SUM(oi.subtotal) FILTER (WHERE o.status = 'COMPLETED'), 0) as revenue,
               COALESCE(SUM(oi.quantity * i.cost_price) FILTER (WHERE o.status = 'COMPLETED'), 0) as cost,
               COALESCE(SUM(oi.quantity) FILTER (WHERE o.status = 'COMPLETED'), 0) as items_sold
        FROM orders o
        LEFT JOIN order_items oi ON oi.order_id = o.id
        LEFT JOIN items i ON i.id = oi.item_id
        WHERE o.order_date >= :from AND o.order_date < :to
        GROUP BY TO_CHAR(o.order_date, 'YYYY-MM-DD')
        ORDER BY period
        """, nativeQuery = true)
    List<Object[]> reportSalesByDay(LocalDateTime from, LocalDateTime to);

    @Query(value = """
        SELECT TO_CHAR(o.order_date, 'YYYY-MM') as period,
               COUNT(DISTINCT o.id) as total_orders,
               COUNT(DISTINCT o.id) FILTER (WHERE o.status = 'CANCELLED') as cancelled_orders,
               COALESCE(SUM(oi.subtotal) FILTER (WHERE o.status = 'COMPLETED'), 0) as revenue,
               COALESCE(SUM(oi.quantity * i.cost_price) FILTER (WHERE o.status = 'COMPLETED'), 0) as cost,
               COALESCE(SUM(oi.quantity) FILTER (WHERE o.status = 'COMPLETED'), 0) as items_sold
        FROM orders o
        LEFT JOIN order_items oi ON oi.order_id = o.id
        LEFT JOIN items i ON i.id = oi.item_id
        WHERE o.order_date >= :from AND o.order_date < :to
        GROUP BY TO_CHAR(o.order_date, 'YYYY-MM')
        ORDER BY period
        """, nativeQuery = true)
    List<Object[]> reportSalesByMonth(LocalDateTime from, LocalDateTime to);

    @Query(value = """
        SELECT TO_CHAR(o.order_date, 'YYYY') as period,
               COUNT(DISTINCT o.id) as total_orders,
               COUNT(DISTINCT o.id) FILTER (WHERE o.status = 'CANCELLED') as cancelled_orders,
               COALESCE(SUM(oi.subtotal) FILTER (WHERE o.status = 'COMPLETED'), 0) as revenue,
               COALESCE(SUM(oi.quantity * i.cost_price) FILTER (WHERE o.status = 'COMPLETED'), 0) as cost,
               COALESCE(SUM(oi.quantity) FILTER (WHERE o.status = 'COMPLETED'), 0) as items_sold
        FROM orders o
        LEFT JOIN order_items oi ON oi.order_id = o.id
        LEFT JOIN items i ON i.id = oi.item_id
        WHERE o.order_date >= :from AND o.order_date < :to
        GROUP BY TO_CHAR(o.order_date, 'YYYY')
        ORDER BY period
        """, nativeQuery = true)
    List<Object[]> reportSalesByYear(LocalDateTime from, LocalDateTime to);

    @Query(value = """
        SELECT oi.item_id,
               i.item_code,
               i.item_name,
               SUM(oi.quantity) as quantity_sold,
               SUM(oi.subtotal) as revenue
        FROM order_items oi
        JOIN orders o ON o.id = oi.order_id
        JOIN items i ON i.id = oi.item_id
        WHERE o.status = 'COMPLETED'
          AND o.order_date >= :from AND o.order_date < :to
        GROUP BY oi.item_id, i.item_code, i.item_name
        ORDER BY quantity_sold DESC, revenue DESC
        LIMIT 5
        """, nativeQuery = true)
    List<Object[]> reportTopProducts(LocalDateTime from, LocalDateTime to);
}

