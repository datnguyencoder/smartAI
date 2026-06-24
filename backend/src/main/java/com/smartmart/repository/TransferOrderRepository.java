package com.smartmart.repository;

import com.smartmart.entity.TransferOrder;
import com.smartmart.enums.TransferStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

import java.util.List;

public interface TransferOrderRepository extends JpaRepository<TransferOrder, Long> {
    
    @EntityGraph(attributePaths = {"fromLocation", "toLocation", "items", "items.item", "items.lot"})
    Optional<TransferOrder> findById(Long id);

    @EntityGraph(attributePaths = {"fromLocation", "toLocation", "items", "items.item", "items.lot"})
    List<TransferOrder> findAllByOrderByIdDesc();

    @EntityGraph(attributePaths = {"fromLocation", "toLocation", "items", "items.item", "items.lot"})
    List<TransferOrder> findByStatusOrderByIdDesc(TransferStatus status);
}
