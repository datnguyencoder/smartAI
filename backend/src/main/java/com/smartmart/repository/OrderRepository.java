package com.smartmart.repository;

import com.smartmart.entity.Order;
import com.smartmart.enums.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface OrderRepository extends JpaRepository<Order, Long> {
    @Query("SELECT o FROM Order o WHERE " +
           "(:status IS NULL OR o.status = :status) AND " +
           "(:keyword IS NULL OR :keyword = '' OR LOWER(o.orderCode) LIKE LOWER(CONCAT('%', CAST(:keyword AS text), '%')) OR LOWER(o.customerName) LIKE LOWER(CONCAT('%', CAST(:keyword AS text), '%'))) AND " +
           "(CAST(:fromDate AS timestamp) IS NULL OR o.orderDate >= :fromDate) AND " +
           "(CAST(:toDate AS timestamp) IS NULL OR o.orderDate <= :toDate)")
    Page<Order> searchOrders(@Param("keyword") String keyword, 
                             @Param("status") OrderStatus status, 
                             @Param("fromDate") LocalDateTime fromDate,
                             @Param("toDate") LocalDateTime toDate,
                             Pageable pageable);

    @Query(value = "SELECT DISTINCT o.customer_name FROM orders o WHERE o.customer_name ILIKE CONCAT('%', :keyword, '%') AND o.customer_name IS NOT NULL LIMIT 10", nativeQuery = true)
    List<String> suggestCustomerNames(@Param("keyword") String keyword);

    Optional<Order> findByOrderCode(String orderCode);

    boolean existsByOrderCodeStartingWith(String prefix);

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
    List<Order> findByCreatedByWithItems(UUID createdBy);
}
