package com.smartmart.repository;

import com.smartmart.entity.PromotionRecommendation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PromotionRecommendationRepository extends JpaRepository<PromotionRecommendation, Long> {
    List<PromotionRecommendation> findByStatus(String status);

    boolean existsByItemIdAndStatus(Long itemId, String status);
}
