package com.smartmart.repository;

import com.smartmart.entity.ForecastResult;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ForecastResultRepository extends JpaRepository<ForecastResult, Long> {
    List<ForecastResult> findByItemIdOrderByForecastDateDesc(Long itemId);
    List<ForecastResult> findTop100ByOrderByForecastDateDesc();
}
