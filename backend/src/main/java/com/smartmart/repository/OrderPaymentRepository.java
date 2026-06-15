package com.smartmart.repository;

import com.smartmart.entity.OrderPayment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface OrderPaymentRepository extends JpaRepository<OrderPayment, Long> {
    List<OrderPayment> findByOrderId(Long orderId);

    @Query("""
        SELECT COALESCE(SUM(op.amount), 0)
        FROM OrderPayment op
        JOIN op.order o
        WHERE o.shift.id = :shiftId
          AND o.status = com.smartmart.enums.OrderStatus.COMPLETED
          AND op.paymentMethod = com.smartmart.enums.PaymentMethod.CASH
        """)
    java.math.BigDecimal sumCashByShiftId(@Param("shiftId") Long shiftId);
}
