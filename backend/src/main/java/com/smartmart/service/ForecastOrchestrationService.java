package com.smartmart.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.smartmart.client.AiClient;
import com.smartmart.entity.*;
import com.smartmart.enums.OrderStatus;
import com.smartmart.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class ForecastOrchestrationService {

    private final AiClient aiClient;
    private final OrderRepository orderRepository;
    private final ItemRepository itemRepository;
    private final ModelTrainingHistoryRepository trainingHistoryRepository;
    private final ForecastResultRepository forecastResultRepository;
    private final ReorderRecommendationService reorderRecommendationService;

    public ForecastOrchestrationService(
            AiClient aiClient,
            OrderRepository orderRepository,
            ItemRepository itemRepository,
            ModelTrainingHistoryRepository trainingHistoryRepository,
            ForecastResultRepository forecastResultRepository,
            ReorderRecommendationService reorderRecommendationService
    ) {
        this.aiClient = aiClient;
        this.orderRepository = orderRepository;
        this.itemRepository = itemRepository;
        this.trainingHistoryRepository = trainingHistoryRepository;
        this.forecastResultRepository = forecastResultRepository;
        this.reorderRecommendationService = reorderRecommendationService;
    }

    @Transactional
    public Map<String, Object> train() {
        List<Map<String, Object>> history = extractSalesHistory(180);
        JsonNode result = aiClient.train(history);

        ModelTrainingHistory record = ModelTrainingHistory.builder()
                .modelType(result.path("model_type").asText("unknown"))
                .mae(BigDecimal.valueOf(result.path("mae").asDouble(0)))
                .rmse(BigDecimal.valueOf(result.path("rmse").asDouble(0)))
                .mape(BigDecimal.valueOf(result.path("mape").asDouble(0)))
                .trainedAt(LocalDateTime.now())
                .build();
        trainingHistoryRepository.save(record);

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("modelType", record.getModelType());
        out.put("mae", record.getMae());
        out.put("rmse", record.getRmse());
        out.put("mape", record.getMape());
        out.put("trainedAt", record.getTrainedAt());
        return out;
    }

    @Transactional
    public Map<String, Object> runForecast() {
        List<Map<String, Object>> itemsPayload = buildForecastPayload();
        JsonNode result = aiClient.forecastAll(itemsPayload);

        ModelTrainingHistory latest = trainingHistoryRepository.findTopByOrderByTrainedAtDesc().orElse(null);
        forecastResultRepository.deleteAll();

        JsonNode predictions = result.path("predictions");
        if (predictions.isArray()) {
            for (JsonNode p : predictions) {
                Long itemId = p.path("item_id").asLong();
                Item item = itemRepository.findById(itemId).orElse(null);
                if (item == null) continue;

                ForecastResult fr = ForecastResult.builder()
                        .item(item)
                        .modelTraining(latest)
                        .forecastDate(LocalDateTime.now())
                        .predictedQuantity(BigDecimal.valueOf(p.path("pred_30d").asDouble(0)))
                        .predictedQty7d(BigDecimal.valueOf(p.path("pred_7d").asDouble(0)))
                        .predictedQty14d(BigDecimal.valueOf(p.path("pred_14d").asDouble(0)))
                        .predictedQty30d(BigDecimal.valueOf(p.path("pred_30d").asDouble(0)))
                        .horizonDays(30)
                        .confidenceLevel(BigDecimal.valueOf(0.85))
                        .build();
                forecastResultRepository.save(fr);
            }
        }

        reorderRecommendationService.recomputeFromForecasts();

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("itemsForecasted", predictions.size());
        out.put("ranAt", LocalDateTime.now());
        return out;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> listResults() {
        return forecastResultRepository.findTop100ByOrderByForecastDateDesc().stream()
                .map(fr -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("itemId", fr.getItem().getId());
                    m.put("itemName", fr.getItem().getItemName());
                    m.put("pred7d", fr.getPredictedQty7d());
                    m.put("pred14d", fr.getPredictedQty14d());
                    m.put("pred30d", fr.getPredictedQty30d());
                    m.put("forecastDate", fr.getForecastDate());
                    return m;
                }).toList();
    }

    @Transactional(readOnly = true)
    public List<ModelTrainingHistory> modelHistory() {
        return trainingHistoryRepository.findAll();
    }

    private List<Map<String, Object>> extractSalesHistory(int days) {
        LocalDateTime since = LocalDateTime.now().minusDays(days);
        List<Object[]> rows = orderRepository.aggregateDailySalesSince(since);
        List<Map<String, Object>> history = new ArrayList<>();
        for (Object[] row : rows) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("item_id", ((Number) row[0]).longValue());
            m.put("sale_date", row[1].toString());
            m.put("quantity", ((Number) row[2]).doubleValue());
            if (row[3] != null) {
                m.put("category_id", ((Number) row[3]).longValue());
            }
            history.add(m);
        }
        return history;
    }

    private List<Map<String, Object>> buildForecastPayload() {
        LocalDateTime since = LocalDateTime.now().minusDays(30);
        List<Order> orders = orderRepository.findCompletedSince(OrderStatus.COMPLETED, since);
        Map<Long, List<Map<String, Object>>> byItem = new HashMap<>();

        for (Order o : orders) {
            String date = o.getOrderDate().toLocalDate().toString();
            for (OrderItem oi : o.getItems()) {
                Long itemId = oi.getItem().getId();
                byItem.computeIfAbsent(itemId, k -> new ArrayList<>())
                        .add(Map.of("sale_date", date, "quantity", oi.getQuantity().doubleValue()));
            }
        }

        List<Map<String, Object>> items = new ArrayList<>();
        for (Map.Entry<Long, List<Map<String, Object>>> e : byItem.entrySet()) {
            items.add(Map.of("item_id", e.getKey(), "recent_sales", e.getValue()));
        }
        return items;
    }
}
