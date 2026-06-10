package com.smartmart.repository;

import com.smartmart.entity.ForecastDailyPoint;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ForecastDailyPointRepository extends JpaRepository<ForecastDailyPoint, Long> {

    List<ForecastDailyPoint> findByForecastResultIdOrderByPointDateAsc(Long forecastResultId);

    void deleteByForecastResultIdIn(List<Long> forecastResultIds);
}
