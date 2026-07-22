package com.smartmart.repository;

import com.smartmart.entity.PromotionUsage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface PromotionUsageRepository extends JpaRepository<PromotionUsage, Long> {

    long countByPromotionIdAndCustomerId(Long promotionId, Long customerId);

    @Query("""
            SELECT pu.promotion.id, COALESCE(SUM(pu.discountAmount), 0)
            FROM PromotionUsage pu
            GROUP BY pu.promotion.id
            """)
    List<Object[]> aggregateDiscountByPromotion();
}
