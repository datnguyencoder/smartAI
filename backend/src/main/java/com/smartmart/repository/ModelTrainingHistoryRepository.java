package com.smartmart.repository;

import com.smartmart.entity.ModelTrainingHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ModelTrainingHistoryRepository extends JpaRepository<ModelTrainingHistory, Long> {
    Optional<ModelTrainingHistory> findTopByOrderByTrainedAtDesc();
}
