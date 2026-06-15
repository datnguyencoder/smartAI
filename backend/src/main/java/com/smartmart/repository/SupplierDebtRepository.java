package com.smartmart.repository;

import com.smartmart.entity.SupplierDebt;
import com.smartmart.enums.SupplierDebtStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SupplierDebtRepository extends JpaRepository<SupplierDebt, Long> {
    List<SupplierDebt> findBySupplierIdOrderByIdDesc(Long supplierId);
    List<SupplierDebt> findByStatusOrderByIdDesc(SupplierDebtStatus status);
    List<SupplierDebt> findAllByOrderByIdDesc();
    boolean existsByPurchaseOrderId(Long purchaseOrderId);
}
