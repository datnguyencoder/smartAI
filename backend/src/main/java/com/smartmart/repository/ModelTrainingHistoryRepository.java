package com.smartmart.repository;

import com.smartmart.model.ModelTrainingHistory;
import com.smartmart.enums.ModelType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ModelTrainingHistoryRepository extends JpaRepository<ModelTrainingHistory, UUID> {
    List<ModelTrainingHistory> findByModelType(ModelType modelType);
}
