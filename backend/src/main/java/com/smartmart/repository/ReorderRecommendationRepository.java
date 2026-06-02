package com.smartmart.repository;

import com.smartmart.entity.ReorderRecommendation;
import com.smartmart.enums.RecommendationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ReorderRecommendationRepository extends JpaRepository<ReorderRecommendation, UUID> {
    List<ReorderRecommendation> findByStatus(RecommendationStatus status);
}
