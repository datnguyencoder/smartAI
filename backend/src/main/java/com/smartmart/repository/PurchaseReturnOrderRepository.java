package com.smartmart.repository;

import com.smartmart.entity.PurchaseReturnOrder;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PurchaseReturnOrderRepository extends JpaRepository<PurchaseReturnOrder, Long> {
    @EntityGraph(attributePaths = {"supplier", "location", "items", "items.item", "items.lot"})
    Optional<PurchaseReturnOrder> findWithDetailsById(Long id);

    @EntityGraph(attributePaths = {"supplier", "location", "items", "items.item"})
    List<PurchaseReturnOrder> findAllByOrderByCreatedAtDesc();

    @EntityGraph(attributePaths = {"supplier"})
    List<PurchaseReturnOrder> findByReturnDateBetween(java.time.LocalDateTime from, java.time.LocalDateTime to);
}
