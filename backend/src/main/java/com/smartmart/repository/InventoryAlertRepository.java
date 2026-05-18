package com.smartmart.repository;

import com.smartmart.model.InventoryAlert;
import com.smartmart.enums.AlertStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface InventoryAlertRepository extends JpaRepository<InventoryAlert, UUID> {
    List<InventoryAlert> findByStatus(AlertStatus status);
}
