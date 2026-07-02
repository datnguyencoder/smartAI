package com.smartmart.repository;

import com.smartmart.entity.ReturnOrder;
import com.smartmart.enums.ReturnOrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ReturnOrderRepository extends JpaRepository<ReturnOrder, Long> {
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
}
