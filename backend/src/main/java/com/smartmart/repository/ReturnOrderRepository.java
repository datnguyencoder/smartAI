package com.smartmart.repository;

import com.smartmart.entity.ReturnOrder;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReturnOrderRepository extends JpaRepository<ReturnOrder, Long> {
    List<ReturnOrder> findAllByOrderByIdDesc();
    List<ReturnOrder> findByOriginalOrderIdOrderByIdDesc(Long originalOrderId);
    boolean existsByOriginalOrderId(Long originalOrderId);
}
