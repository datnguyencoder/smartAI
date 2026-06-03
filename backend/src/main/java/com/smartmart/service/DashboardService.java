package com.smartmart.service;

import java.util.List;
import java.util.Map;

public interface DashboardService {

    Map<String, Object> summary();
    List<Map<String, Object>> revenue7d();
    Map<String, Object> forecastSummary();
}
