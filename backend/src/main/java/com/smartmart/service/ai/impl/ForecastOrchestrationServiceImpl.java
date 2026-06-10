package com.smartmart.service.ai.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.smartmart.client.AiClient;
import com.smartmart.dto.response.ForecastItemDetailResponse;
import com.smartmart.entity.*;
import com.smartmart.enums.OrderStatus;
import com.smartmart.exception.NotFoundException;
import com.smartmart.repository.*;
import com.smartmart.service.ai.ReorderRecommendationService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class ForecastOrchestrationServiceImpl implements com.smartmart.service.ai.ForecastOrchestrationService {

    private final AiClient aiClient;
    private final OrderRepository orderRepository;
    private final ItemRepository itemRepository;
    private final ModelTrainingHistoryRepository trainingHistoryRepository;
    private final ForecastResultRepository forecastResultRepository;
    private final ForecastDailyPointRepository forecastDailyPointRepository;
    private final ReorderRecommendationService reorderRecommendationService;

    public ForecastOrchestrationServiceImpl(
            AiClient aiClient,
            OrderRepository orderRepository,
            ItemRepository itemRepository,
            ModelTrainingHistoryRepository trainingHistoryRepository,
            ForecastResultRepository forecastResultRepository,
            ForecastDailyPointRepository forecastDailyPointRepository,
            ReorderRecommendationService reorderRecommendationService
    ) {
        this.aiClient = aiClient;
        this.orderRepository = orderRepository;
        this.itemRepository = itemRepository;
        this.trainingHistoryRepository = trainingHistoryRepository;
        this.forecastResultRepository = forecastResultRepository;
        this.forecastDailyPointRepository = forecastDailyPointRepository;
        this.reorderRecommendationService = reorderRecommendationService;
    }

    @Transactional
    @Override
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
    @Override
    public Map<String, Object> runForecast() {
        List<Map<String, Object>> itemsPayload = buildForecastPayload();
        JsonNode result = aiClient.forecastAll(itemsPayload);

        ModelTrainingHistory latest = trainingHistoryRepository.findTopByOrderByTrainedAtDesc().orElse(null);

        List<Long> oldIds = forecastResultRepository.findAll().stream().map(ForecastResult::getId).toList();
        if (!oldIds.isEmpty()) {
            forecastDailyPointRepository.deleteByForecastResultIdIn(oldIds);
        }
        forecastResultRepository.deleteAll();

        JsonNode forecasts = result.path("forecasts");
        if (!forecasts.isArray()) {
            forecasts = result.path("predictions");
        }
        int saved = 0;
        if (forecasts.isArray()) {
            for (JsonNode p : forecasts) {
                Long itemId = p.path("item_id").asLong();
                Item item = itemRepository.findById(itemId).orElse(null);
                if (item == null) continue;

                double pred7 = firstDouble(p, "predicted_qty_7d", "pred_7d");
                double pred14 = firstDouble(p, "predicted_qty_14d", "pred_14d");
                double pred30 = firstDouble(p, "predicted_qty_30d", "pred_30d");
                String modelType = p.path("model_type").asText(null);

                ForecastResult fr = ForecastResult.builder()
                        .item(item)
                        .modelTraining(latest)
                        .forecastDate(LocalDateTime.now())
                        .predictedQuantity(BigDecimal.valueOf(pred30))
                        .predictedQty7d(BigDecimal.valueOf(pred7))
                        .predictedQty14d(BigDecimal.valueOf(pred14))
                        .predictedQty30d(BigDecimal.valueOf(pred30))
                        .horizonDays(30)
                        .confidenceLevel(BigDecimal.valueOf(0.85))
                        .modelType(modelType)
                        .build();
                forecastResultRepository.save(fr);
                saveDailySeries(fr, p.path("daily_series"));
                saved++;
            }
        }

        reorderRecommendationService.recomputeFromForecasts();

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("itemsForecasted", saved);
        out.put("ranAt", LocalDateTime.now());
        return out;
    }

    @Transactional(readOnly = true)
    @Override
    public List<Map<String, Object>> listResults() {
        return forecastResultRepository.findTop100ByOrderByForecastDateDesc().stream()
                .map(fr -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("itemId", fr.getItem().getId());
                    m.put("itemName", fr.getItem().getItemName());
                    m.put("pred7d", fr.getPredictedQty7d());
                    m.put("pred14d", fr.getPredictedQty14d());
                    m.put("pred30d", fr.getPredictedQty30d());
                    m.put("modelType", fr.getModelType());
                    m.put("forecastDate", fr.getForecastDate());
                    return m;
                }).toList();
    }

    @Transactional(readOnly = true)
    @Override
    public ForecastItemDetailResponse getItemResult(Long itemId) {
        ForecastResult fr = forecastResultRepository.findFirstByItemIdOrderByForecastDateDesc(itemId)
                .orElseThrow(() -> new NotFoundException("Forecast result not found for item " + itemId));

        List<ForecastItemDetailResponse.DailyPoint> series = forecastDailyPointRepository
                .findByForecastResultIdOrderByPointDateAsc(fr.getId())
                .stream()
                .map(dp -> ForecastItemDetailResponse.DailyPoint.builder()
                        .date(dp.getPointDate().toString())
                        .predictedQty(dp.getPredictedQty())
                        .build())
                .toList();

        return ForecastItemDetailResponse.builder()
                .itemId(fr.getItem().getId())
                .itemName(fr.getItem().getItemName())
                .pred7d(fr.getPredictedQty7d())
                .pred14d(fr.getPredictedQty14d())
                .pred30d(fr.getPredictedQty30d())
                .modelType(fr.getModelType())
                .forecastDate(fr.getForecastDate())
                .dailySeries(series)
                .build();
    }

    @Transactional(readOnly = true)
    @Override
    public List<ModelTrainingHistory> modelHistory() {
        return trainingHistoryRepository.findAll();
    }

    private void saveDailySeries(ForecastResult fr, JsonNode dailySeries) {
        if (!dailySeries.isArray()) {
            return;
        }
        for (JsonNode point : dailySeries) {
            String dateStr = point.path("date").asText(null);
            if (dateStr == null || dateStr.isBlank()) {
                continue;
            }
            forecastDailyPointRepository.save(ForecastDailyPoint.builder()
                    .forecastResult(fr)
                    .pointDate(LocalDate.parse(dateStr))
                    .predictedQty(BigDecimal.valueOf(point.path("predicted_qty").asDouble(0)))
                    .build());
        }
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
            m.put("category_id", row[3] != null ? ((Number) row[3]).longValue() : 1L);
            history.add(m);
        }
        return history;
    }

    private List<Map<String, Object>> buildForecastPayload() {
        LocalDateTime since = LocalDateTime.now().minusDays(30);
        List<Order> orders = orderRepository.findCompletedSince(OrderStatus.COMPLETED, since);
        Map<Long, List<Map<String, Object>>> byItem = new LinkedHashMap<>();
        Map<Long, Long> categoryByItem = new HashMap<>();

        for (Order o : orders) {
            String date = o.getOrderDate().toLocalDate().toString();
            for (OrderItem oi : o.getItems()) {
                Item item = oi.getItem();
                Long itemId = item.getId();
                long categoryId = item.getCategory() != null ? item.getCategory().getId() : 1L;
                categoryByItem.put(itemId, categoryId);

                Map<String, Object> sale = new LinkedHashMap<>();
                sale.put("item_id", itemId);
                sale.put("sale_date", date);
                sale.put("quantity", oi.getQuantity().doubleValue());
                sale.put("category_id", categoryId);
                byItem.computeIfAbsent(itemId, k -> new ArrayList<>()).add(sale);
            }
        }

        List<Map<String, Object>> items = new ArrayList<>();
        for (Map.Entry<Long, List<Map<String, Object>>> e : byItem.entrySet()) {
            Map<String, Object> itemPayload = new LinkedHashMap<>();
            itemPayload.put("item_id", e.getKey());
            itemPayload.put("category_id", categoryByItem.getOrDefault(e.getKey(), 1L));
            itemPayload.put("recent_sales", e.getValue());
            items.add(itemPayload);
        }
        return items;
    }

    private static double firstDouble(JsonNode node, String primary, String fallback) {
        if (node.has(primary) && !node.path(primary).isMissingNode()) {
            return node.path(primary).asDouble(0);
        }
        return node.path(fallback).asDouble(0);
    }
}
