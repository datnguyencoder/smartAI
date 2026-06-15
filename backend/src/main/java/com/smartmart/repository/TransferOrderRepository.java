package com.smartmart.repository;

import com.smartmart.entity.TransferOrder;
import com.smartmart.enums.TransferStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TransferOrderRepository extends JpaRepository<TransferOrder, Long> {
    List<TransferOrder> findAllByOrderByIdDesc();
    List<TransferOrder> findByStatusOrderByIdDesc(TransferStatus status);
}
