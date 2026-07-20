package com.smartmart.repository;

import com.smartmart.entity.ReturnOrder;
import com.smartmart.enums.ReturnOrderStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public interface ReturnOrderRepository extends JpaRepository<ReturnOrder, Long> {
    @Query("""
        SELECT COALESCE(SUM(r.refundAmount), 0)
        FROM ReturnOrder r
        WHERE r.status = com.smartmart.enums.ReturnOrderStatus.COMPLETED
        """)
    BigDecimal sumAllCompletedRefunds();

    @Query("""
        SELECT COALESCE(SUM(r.refundAmount), 0)
        FROM ReturnOrder r
        WHERE r.status = com.smartmart.enums.ReturnOrderStatus.COMPLETED
          AND r.returnDate >= :from
          AND r.returnDate < :to
        """)
    BigDecimal sumCompletedRefundsBetween(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to
    );

    @Query("""
        SELECT COALESCE(SUM(r.refundAmount), 0)
        FROM ReturnOrder r
        WHERE r.status = com.smartmart.enums.ReturnOrderStatus.COMPLETED
          AND r.returnDate >= :from
        """)
    BigDecimal sumCompletedRefundsFrom(@Param("from") LocalDateTime from);

    @Query("""
        SELECT COALESCE(SUM(r.refundAmount), 0)
        FROM ReturnOrder r
        WHERE r.status = com.smartmart.enums.ReturnOrderStatus.COMPLETED
          AND r.returnDate < :to
        """)
    BigDecimal sumCompletedRefundsBefore(@Param("to") LocalDateTime to);


    @EntityGraph(attributePaths = {"originalOrder", "items", "items.item", "items.lot"})
    @Query("SELECT ro FROM ReturnOrder ro WHERE ro.id = :id")
    Optional<ReturnOrder> findWithDetailsById(@Param("id") Long id);

    @EntityGraph(attributePaths = {"originalOrder", "items", "items.item", "items.lot"})
    @Query("SELECT DISTINCT ro FROM ReturnOrder ro ORDER BY ro.id DESC")
    List<ReturnOrder> findAllWithDetailsOrderByIdDesc();

    @EntityGraph(attributePaths = {"originalOrder", "items", "items.item", "items.lot"})
    @Query("SELECT DISTINCT ro FROM ReturnOrder ro WHERE ro.originalOrder.id = :originalOrderId ORDER BY ro.id DESC")
    List<ReturnOrder> findByOriginalOrderIdWithDetailsOrderByIdDesc(@Param("originalOrderId") Long originalOrderId);

    List<ReturnOrder> findAllByOrderByIdDesc();
    List<ReturnOrder> findByOriginalOrderIdOrderByIdDesc(Long originalOrderId);
    boolean existsByOriginalOrderId(Long originalOrderId);


    @Query("""
        SELECT r FROM ReturnOrder r
        JOIN FETCH r.originalOrder o
        WHERE o.shift.id = :shiftId AND r.status = :status
        ORDER BY r.returnDate DESC
        """)
    List<ReturnOrder> findByShiftIdAndStatus(
            @Param("shiftId") Long shiftId,
            @Param("status") ReturnOrderStatus status
    );

    @EntityGraph(attributePaths = {"originalOrder", "originalOrder.shift", "items", "items.item"})
    @Query("""
        SELECT DISTINCT r FROM ReturnOrder r
        WHERE r.originalOrder.shift.id IN :shiftIds AND r.status = :status
        ORDER BY r.returnDate DESC
        """)
    List<ReturnOrder> findByShiftIdsAndStatusWithItems(
            @Param("shiftIds") List<Long> shiftIds,
            @Param("status") ReturnOrderStatus status
    );

    @EntityGraph(attributePaths = {"originalOrder", "items", "items.item"})
    @Query("""
        SELECT DISTINCT r FROM ReturnOrder r
        WHERE r.originalOrder.shift.id = :shiftId AND r.status = :status
        ORDER BY r.returnDate ASC
        """)
    List<ReturnOrder> findByShiftIdAndStatusWithItems(
            @Param("shiftId") Long shiftId,
            @Param("status") ReturnOrderStatus status
    );
}
