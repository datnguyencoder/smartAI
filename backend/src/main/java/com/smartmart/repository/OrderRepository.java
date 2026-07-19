package com.smartmart.repository;

import com.smartmart.entity.Order;
import com.smartmart.enums.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long>, JpaSpecificationExecutor<Order> {
    @Query("""
    SELECT o FROM Order o
    WHERE (:status IS NULL OR o.status = :status)
      AND (
          :keyword IS NULL
          OR :keyword = ''
          OR LOWER(o.orderCode) LIKE LOWER(CONCAT('%', :keyword, '%'))
          OR LOWER(o.customerName) LIKE LOWER(CONCAT('%', :keyword, '%'))
      )
      AND (:fromDate IS NULL OR o.orderDate >= :fromDate)
      AND (:toDate IS NULL OR o.orderDate <= :toDate)
    """)
    Page<Order> searchOrders(
            @Param("keyword") String keyword,
            @Param("status") OrderStatus status,
            @Param("fromDate") LocalDateTime fromDate,
            @Param("toDate") LocalDateTime toDate,
            Pageable pageable
    );

    @Query(value = "SELECT DISTINCT o.customer_name FROM orders o WHERE o.customer_name ILIKE CONCAT('%', :keyword, '%') AND o.customer_name IS NOT NULL LIMIT 10", nativeQuery = true)
    List<String> suggestCustomerNames(@Param("keyword") String keyword);

    Optional<Order> findByOrderCode(String orderCode);

    boolean existsByOrderCodeStartingWith(String prefix);

    List<Order> findByOrderCodeStartingWith(String prefix);

    @Query("""
        SELECT o FROM Order o
        LEFT JOIN FETCH o.items oi
        LEFT JOIN FETCH oi.item
        WHERE o.status = :status AND o.orderDate >= :since
        ORDER BY o.id DESC
        """)
    List<Order> findCompletedSince(OrderStatus status, LocalDateTime since);

    @Query(value = """
        SELECT CAST(oi.item_id AS BIGINT) as item_id,
               CAST(o.order_date AS DATE) as sale_date,
               SUM(oi.quantity) as quantity,
               MAX(COALESCE(oi.category_id_at_sale, i.category_id)) as category_id
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
        LEFT JOIN FETCH oi.lot
        LEFT JOIN FETCH oi.location
        WHERE o.id = :id
        """)    Optional<Order> findByIdWithItems(Long id);

    @Query("""
        SELECT o FROM Order o
        LEFT JOIN FETCH o.items oi
        LEFT JOIN FETCH oi.item
        ORDER BY o.id DESC
        """)
    List<Order> findAllWithItems();

    @Query("""
        SELECT o FROM Order o
        LEFT JOIN FETCH o.items oi
        LEFT JOIN FETCH oi.item
        WHERE o.createdBy = :createdBy
        ORDER BY o.id DESC
        """)
    List<Order> findByCreatedByWithItems(Long createdBy);

    @Query("""
        SELECT o FROM Order o
        LEFT JOIN FETCH o.items oi
        LEFT JOIN FETCH oi.item
        WHERE o.customerPhone = :customerPhone
        ORDER BY o.orderDate DESC
        """)
    List<Order> findByCustomerPhoneWithItems(String customerPhone);

    @Query(value = """
        SELECT TO_CHAR(o.order_date, 'YYYY-MM-DD') as period,
               COUNT(DISTINCT o.id) as total_orders,
               COUNT(DISTINCT CASE WHEN o.status = 'CANCELLED' THEN o.id END) as cancelled_orders,
               COALESCE(SUM(CASE WHEN o.status = 'COMPLETED' THEN oi.subtotal ELSE 0 END), 0) as revenue,
               COALESCE(SUM(CASE WHEN o.status = 'COMPLETED' THEN oi.quantity * i.cost_price ELSE 0 END), 0) as cost,
               COALESCE(SUM(CASE WHEN o.status = 'COMPLETED' THEN oi.quantity ELSE 0 END), 0) as items_sold
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
               COUNT(DISTINCT CASE WHEN o.status = 'CANCELLED' THEN o.id END) as cancelled_orders,
               COALESCE(SUM(CASE WHEN o.status = 'COMPLETED' THEN oi.subtotal ELSE 0 END), 0) as revenue,
               COALESCE(SUM(CASE WHEN o.status = 'COMPLETED' THEN oi.quantity * i.cost_price ELSE 0 END), 0) as cost,
               COALESCE(SUM(CASE WHEN o.status = 'COMPLETED' THEN oi.quantity ELSE 0 END), 0) as items_sold
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
               COUNT(DISTINCT CASE WHEN o.status = 'CANCELLED' THEN o.id END) as cancelled_orders,
               COALESCE(SUM(CASE WHEN o.status = 'COMPLETED' THEN oi.subtotal ELSE 0 END), 0) as revenue,
               COALESCE(SUM(CASE WHEN o.status = 'COMPLETED' THEN oi.quantity * i.cost_price ELSE 0 END), 0) as cost,
               COALESCE(SUM(CASE WHEN o.status = 'COMPLETED' THEN oi.quantity ELSE 0 END), 0) as items_sold
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
        LIMIT :limit
        """, nativeQuery = true)
    List<Object[]> reportBestSellers(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to, @Param("limit") int limit);

    @Query(value = """
        SELECT TO_CHAR(o.order_date, 'IYYY-"W"IW') as period,
               COUNT(DISTINCT o.id) as total_orders,
               COUNT(DISTINCT CASE WHEN o.status = 'CANCELLED' THEN o.id END) as cancelled_orders,
               COALESCE(SUM(CASE WHEN o.status = 'COMPLETED' THEN oi.subtotal ELSE 0 END), 0) as revenue,
               COALESCE(SUM(CASE WHEN o.status = 'COMPLETED' THEN oi.quantity * i.cost_price ELSE 0 END), 0) as cost,
               COALESCE(SUM(CASE WHEN o.status = 'COMPLETED' THEN oi.quantity ELSE 0 END), 0) as items_sold
        FROM orders o
        LEFT JOIN order_items oi ON oi.order_id = o.id
        LEFT JOIN items i ON i.id = oi.item_id
        WHERE o.order_date >= :from AND o.order_date < :to
        GROUP BY TO_CHAR(o.order_date, 'IYYY-"W"IW')
        ORDER BY period
        """, nativeQuery = true)
    List<Object[]> reportSalesByWeek(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Query(value = """
        SELECT CAST(COALESCE(oi.category_id_at_sale, i.category_id) AS BIGINT) as category_id,
               COALESCE(oi.category_name_at_sale, c.category_name) as category_name,
               SUM(oi.quantity) as quantity_sold,
               SUM(oi.subtotal) as revenue
        FROM order_items oi
        JOIN orders o ON o.id = oi.order_id
        LEFT JOIN items i ON i.id = oi.item_id
        LEFT JOIN categories c ON c.id = COALESCE(oi.category_id_at_sale, i.category_id)
        WHERE o.status = 'COMPLETED'
          AND o.order_date >= :from AND o.order_date < :to
        GROUP BY COALESCE(oi.category_id_at_sale, i.category_id), COALESCE(oi.category_name_at_sale, c.category_name)
        ORDER BY revenue DESC, quantity_sold DESC
        LIMIT :limit
        """, nativeQuery = true)
    List<Object[]> reportBestSellerCategories(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to, @Param("limit") int limit);

    List<Order> findByShiftId(Long shiftId);

    @Query("""
    SELECT o FROM Order o
    LEFT JOIN FETCH o.payments
    WHERE o.shift.id = :shiftId
      AND o.status = com.smartmart.enums.OrderStatus.COMPLETED
    """)
    List<Order> findCompletedByShiftId(@Param("shiftId") Long shiftId);
}

