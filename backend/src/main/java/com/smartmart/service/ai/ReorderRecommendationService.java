package com.smartmart.service.ai;

import java.util.List;
import java.util.Map;

public interface ReorderRecommendationService {

    void recomputeFromForecasts();

    List<Map<String, Object>> listActive();
}
