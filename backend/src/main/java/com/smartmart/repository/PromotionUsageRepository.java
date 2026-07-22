package com.smartmart.repository;

import com.smartmart.entity.PromotionUsage;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PromotionUsageRepository extends JpaRepository<PromotionUsage, Long> {

    long countByPromotionIdAndCustomerId(Long promotionId, Long customerId);
}
