package com.smartmart.repository;

import com.smartmart.model.ForecastResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ForecastResultRepository extends JpaRepository<ForecastResult, UUID> {
    List<ForecastResult> findByProductId(UUID productId);
}
