package com.smartmart.repository;

import com.smartmart.entity.HeldOrder;
import com.smartmart.enums.HeldOrderStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface HeldOrderRepository extends JpaRepository<HeldOrder, Long> {
    @EntityGraph(attributePaths = {"items", "items.item", "shift"})
    List<HeldOrder> findByStatusOrderByCreatedAtDesc(HeldOrderStatus status);

    @EntityGraph(attributePaths = {"items", "items.item", "shift"})
    List<HeldOrder> findByCashierIdAndStatusOrderByCreatedAtDesc(Long cashierId, HeldOrderStatus status);
}
