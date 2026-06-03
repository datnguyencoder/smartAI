package com.smartmart.service.ai;

import com.smartmart.entity.ModelTrainingHistory;

import java.util.List;
import java.util.Map;

public interface ForecastOrchestrationService {

    Map<String, Object> train();

    Map<String, Object> runForecast();

    List<Map<String, Object>> listResults();

    List<ModelTrainingHistory> modelHistory();
}
