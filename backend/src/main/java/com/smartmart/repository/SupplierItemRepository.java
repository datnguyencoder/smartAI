package com.smartmart.repository;

import com.smartmart.entity.SupplierItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SupplierItemRepository extends JpaRepository<SupplierItem, Long> {
    boolean existsBySupplierIdAndSkuItemIgnoreCaseAndActiveTrue(Long supplierId, String skuItem);

    List<SupplierItem> findBySupplierIdAndActiveTrue(Long supplierId);

    List<SupplierItem> findBySupplierId(Long supplierId);

    Optional<SupplierItem> findBySupplierIdAndSkuItemIgnoreCase(Long supplierId, String skuItem);

    boolean existsBySupplierIdAndSkuItemIgnoreCase(Long supplierId, String skuItem);
}
