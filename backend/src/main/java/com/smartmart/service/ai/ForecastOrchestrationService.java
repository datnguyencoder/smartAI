package com.smartmart.service.ai;

import com.smartmart.dto.response.AiStatusResponse;
import com.smartmart.dto.response.ForecastItemDetailResponse;
import com.smartmart.dto.response.ForecastResultResponse;
import com.smartmart.dto.response.ForecastRunResponse;
import com.smartmart.dto.response.TrainResultResponse;
import com.smartmart.entity.ModelTrainingHistory;

import java.util.List;

public interface ForecastOrchestrationService {

    TrainResultResponse train();

    ForecastRunResponse runForecast();

    List<ForecastResultResponse> listResults();

    ForecastItemDetailResponse getItemResult(Long itemId);

    List<ModelTrainingHistory> modelHistory();

    AiStatusResponse getAiStatus();

    /** Bắt đầu training async. Trả về jobId để client poll trạng thái. */
    String submitTrainAsync();
}
