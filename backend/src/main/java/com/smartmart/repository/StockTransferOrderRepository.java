package com.smartmart.repository;

import com.smartmart.entity.StockTransferOrder;
import com.smartmart.enums.StockTransferOrderStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface StockTransferOrderRepository extends JpaRepository<StockTransferOrder, Long> {
    @EntityGraph(attributePaths = {"fromLocation", "toLocation", "items", "items.item", "items.lot"})
    Optional<StockTransferOrder> findWithDetailsById(Long id);

    @EntityGraph(attributePaths = {"fromLocation", "toLocation", "items", "items.item"})
    List<StockTransferOrder> findByStatusOrderByCreatedAtDesc(StockTransferOrderStatus status);

    @EntityGraph(attributePaths = {"fromLocation", "toLocation", "items", "items.item"})
    List<StockTransferOrder> findAllByOrderByCreatedAtDesc();
}
