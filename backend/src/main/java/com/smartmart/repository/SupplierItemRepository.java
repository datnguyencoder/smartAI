package com.smartmart.repository;

import com.smartmart.entity.SupplierItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface SupplierItemRepository extends JpaRepository<SupplierItem, Long> {
    boolean existsBySupplierIdAndSkuItemIgnoreCaseAndActiveTrue(Long supplierId, String skuItem);

    List<SupplierItem> findBySupplierIdAndActiveTrue(Long supplierId);

    List<SupplierItem> findBySupplierId(Long supplierId);

    Optional<SupplierItem> findBySupplierIdAndSkuItemIgnoreCase(Long supplierId, String skuItem);

    boolean existsBySupplierIdAndSkuItemIgnoreCase(Long supplierId, String skuItem);

    // Fallback khi sản phẩm chưa từng được nhập lần nào — chọn NCC có giá nhập rẻ nhất
    // trong số các NCC đang active cung cấp SKU này.
    Optional<SupplierItem> findFirstBySkuItemIgnoreCaseAndActiveTrueOrderByDefaultCostPriceAsc(String skuItem);

    @Query("""
    SELECT AVG(si.defaultCostPrice)
    FROM SupplierItem si
    WHERE LOWER(si.skuItem) = LOWER(:skuItem)
      AND si.active = true
      AND si.defaultCostPrice IS NOT NULL
""")
    BigDecimal averageDefaultCostPriceBySkuItem(@Param("skuItem") String skuItem);
}
