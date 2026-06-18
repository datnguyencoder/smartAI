package com.smartmart.repository;

import com.smartmart.entity.ReorderRecommendation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.math.BigDecimal;
import java.util.List;

public interface ReorderRecommendationRepository extends JpaRepository<ReorderRecommendation, Long> {
    List<ReorderRecommendation> findByStatusOrderBySuggestedQtyDesc(String status);

    List<ReorderRecommendation> findByStatusAndSuggestedQtyGreaterThanOrderBySuggestedQtyDesc(
            String status,
            BigDecimal suggestedQty
    );
}
