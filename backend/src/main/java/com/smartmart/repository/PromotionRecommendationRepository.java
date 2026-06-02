package com.smartmart.repository;

import com.smartmart.entity.PromotionRecommendation;
import com.smartmart.enums.RecommendationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PromotionRecommendationRepository extends JpaRepository<PromotionRecommendation, UUID> {
    List<PromotionRecommendation> findByStatus(RecommendationStatus status);
}
