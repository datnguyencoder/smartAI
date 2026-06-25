package com.smartmart.service.ai.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartmart.client.AiClient;
import com.smartmart.dto.response.AiStatusResponse;
import com.smartmart.dto.response.ForecastItemDetailResponse;
import com.smartmart.dto.response.ForecastResultResponse;
import com.smartmart.dto.response.ForecastRunResponse;
import com.smartmart.dto.response.TrainJobResponse;
import com.smartmart.dto.response.TrainResultResponse;
import com.smartmart.entity.*;
import com.smartmart.enums.OrderStatus;
import com.smartmart.exception.AiServiceException;
import com.smartmart.exception.NotFoundException;
import com.smartmart.repository.*;
import com.smartmart.service.ai.ReorderRecommendationService;
import com.smartmart.service.ai.TrainingJobStore;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.UUID;

@Service
public class ForecastOrchestrationServiceImpl implements com.smartmart.service.ai.ForecastOrchestrationService {

    private static final Logger log = LoggerFactory.getLogger(ForecastOrchestrationServiceImpl.class);

    private final AiClient aiClient;
    private final OrderRepository orderRepository;
    private final ItemRepository itemRepository;
    private final ModelTrainingHistoryRepository trainingHistoryRepository;
    private final ForecastResultRepository forecastResultRepository;
    private final ForecastDailyPointRepository forecastDailyPointRepository;
    private final CurrentInventoryRepository currentInventoryRepository;
    private final ReorderRecommendationService reorderRecommendationService;
    private final TrainingJobStore trainingJobStore;
    private final ObjectMapper objectMapper;

    public ForecastOrchestrationServiceImpl(
            AiClient aiClient,
            OrderRepository orderRepository,
            ItemRepository itemRepository,
            ModelTrainingHistoryRepository trainingHistoryRepository,
            ForecastResultRepository forecastResultRepository,
            ForecastDailyPointRepository forecastDailyPointRepository,
            CurrentInventoryRepository currentInventoryRepository,
            ReorderRecommendationService reorderRecommendationService,
            TrainingJobStore trainingJobStore,
            ObjectMapper objectMapper
    ) {
        this.aiClient = aiClient;
        this.orderRepository = orderRepository;
        this.itemRepository = itemRepository;
        this.trainingHistoryRepository = trainingHistoryRepository;
        this.forecastResultRepository = forecastResultRepository;
        this.forecastDailyPointRepository = forecastDailyPointRepository;
        this.currentInventoryRepository = currentInventoryRepository;
        this.reorderRecommendationService = reorderRecommendationService;
        this.trainingJobStore = trainingJobStore;
        this.objectMapper = objectMapper;
    }

    @Transactional
    @Override
    public TrainResultResponse train() {
        List<Map<String, Object>> history = extractSalesHistory(180);
        JsonNode result = aiClient.train(history);

        String perItemJson = null;
        JsonNode itemTypes = result.path("item_model_types");
        if (itemTypes.isObject() && !itemTypes.isEmpty()) {
            try {
                perItemJson = objectMapper.writeValueAsString(itemTypes);
            } catch (Exception ignored) {
                perItemJson = itemTypes.toString();
            }
        }

        ModelTrainingHistory record = ModelTrainingHistory.builder()
                .modelType(result.path("model_type").asText("unknown"))
                .mae(BigDecimal.valueOf(result.path("mae").asDouble(0)))
                .rmse(BigDecimal.valueOf(result.path("rmse").asDouble(0)))
                .mape(BigDecimal.valueOf(result.path("mape").asDouble(0)))
                .trainedAt(LocalDateTime.now())
                .perItemModelTypes(perItemJson)
                .build();
        trainingHistoryRepository.save(record);

        ForecastRunResponse forecastSummary = runForecast();

        return TrainResultResponse.builder()
                .modelType(record.getModelType())
                .mae(record.getMae())
                .rmse(record.getRmse())
                .mape(record.getMape())
                .trainedAt(record.getTrainedAt())
                .trainingSamples(result.path("training_samples").asInt(0))
                .nItemsMl(result.path("n_items_ml").asInt(0))
                .nItemsMa(result.path("n_items_ma").asInt(0))
                .itemsForecasted(forecastSummary.getItemsForecasted())
                .itemsSubmitted(forecastSummary.getItemsSubmitted())
                .forecastSource(forecastSummary.getSource())
                .ranAt(forecastSummary.getRanAt())
                .build();
    }

    @Override
    public String submitTrainAsync() {
        String jobId = UUID.randomUUID().toString().replace("-", "").substring(0, 12);
        TrainJobResponse job = TrainJobResponse.builder()
                .jobId(jobId)
                .status("QUEUED")
                .startedAt(LocalDateTime.now())
                .build();
        trainingJobStore.put(jobId, job);
        runTrainAsync(jobId);
        return jobId;
    }

    @Async("forecastTaskExecutor")
    public void runTrainAsync(String jobId) {
        TrainJobResponse job = trainingJobStore.get(jobId).orElse(null);
        if (job == null) return;
        job.setStatus("RUNNING");
        try {
            TrainResultResponse result = train();
            job.setStatus("DONE");
            job.setResult(result);
        } catch (Exception ex) {
            log.error("Async training job {} failed: {}", jobId, ex.getMessage(), ex);
            job.setStatus("FAILED");
            job.setErrorMessage(ex.getMessage());
        } finally {
            job.setCompletedAt(LocalDateTime.now());
        }
    }

    @Transactional
    @Override
    public ForecastRunResponse runForecast() {
        List<Map<String, Object>> itemsPayload = buildForecastPayload();
        JsonNode result;
        try {
            result = aiClient.forecastAll(itemsPayload);
        } catch (AiServiceException ex) {
            reorderRecommendationService.recomputeFallbackFromSalesAverage();
            return ForecastRunResponse.builder()
                    .itemsForecasted(0)
                    .itemsSubmitted(itemsPayload.size())
                    .source("FALLBACK")
                    .message("AI offline - gợi ý nhập hàng đã được tính bằng lịch sử bán 30 ngày")
                    .ranAt(LocalDateTime.now())
                    .build();
        }

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
                double confLow = firstDouble(p, "confidence_low", "confidence_low");
                double confHigh = firstDouble(p, "confidence_high", "confidence_high");
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
                        .confidenceLow(BigDecimal.valueOf(confLow))
                        .confidenceHigh(BigDecimal.valueOf(confHigh))
                        .modelType(modelType)
                        .build();
                forecastResultRepository.save(fr);
                saveDailySeries(fr, p.path("daily_series"));
                saved++;
            }
        }

        reorderRecommendationService.recomputeFromForecasts();

        return ForecastRunResponse.builder()
                .itemsForecasted(saved)
                .itemsSubmitted(itemsPayload.size())
                .source("AI")
                .ranAt(LocalDateTime.now())
                .build();
    }

    @Transactional(readOnly = true)
    @Override
    public List<ForecastResultResponse> listResults() {
        return forecastResultRepository.findTop100ByOrderByForecastDateDesc().stream()
                .map(this::toResultResponse)
                .sorted(Comparator.comparingInt(r -> riskSortOrder(r.getRiskLevel())))
                .toList();
    }

    @Transactional(readOnly = true)
    @Override
    public ForecastItemDetailResponse getItemResult(Long itemId) {
        ForecastResult fr = forecastResultRepository.findFirstByItemIdOrderByForecastDateDesc(itemId)
                .orElseThrow(() -> new NotFoundException("Forecast result not found for item " + itemId));

        List<ForecastItemDetailResponse.DailyPoint> series = forecastDailyPointRepository
                .findByForecastResultIdOrderByPointDateAsc(fr.getId())
                .stream()
                .map(dp -> {
                    BigDecimal qty = dp.getPredictedQty();
                    BigDecimal ratio = fr.getPredictedQty30d() != null && fr.getPredictedQty30d().compareTo(BigDecimal.ZERO) > 0
                            ? qty.divide(fr.getPredictedQty30d(), 6, java.math.RoundingMode.HALF_UP)
                            : BigDecimal.ONE;
                    BigDecimal low = fr.getConfidenceLow() != null
                            ? fr.getConfidenceLow().multiply(ratio) : qty;
                    BigDecimal high = fr.getConfidenceHigh() != null
                            ? fr.getConfidenceHigh().multiply(ratio) : qty;
                    return ForecastItemDetailResponse.DailyPoint.builder()
                            .date(dp.getPointDate().toString())
                            .predictedQty(qty)
                            .confidenceLow(low)
                            .confidenceHigh(high)
                            .build();
                })
                .toList();

        Map<String, Object> insight = buildStockInsight(fr.getItem(), fr.getPredictedQty30d(), fr.getPredictedQty7d());

        return ForecastItemDetailResponse.builder()
                .itemId(fr.getItem().getId())
                .itemCode(fr.getItem().getItemCode())
                .itemName(fr.getItem().getItemName())
                .pred7d(fr.getPredictedQty7d())
                .pred14d(fr.getPredictedQty14d())
                .pred30d(fr.getPredictedQty30d())
                .modelType(fr.getModelType())
                .forecastDate(fr.getForecastDate())
                .confidenceLow(fr.getConfidenceLow())
                .confidenceHigh(fr.getConfidenceHigh())
                .stockOnHand((BigDecimal) insight.get("stockOnHand"))
                .shortageQty((BigDecimal) insight.get("shortageQty"))
                .surplusQty((BigDecimal) insight.get("surplusQty"))
                .riskLevel((String) insight.get("riskLevel"))
                .recommendation((String) insight.get("recommendation"))
                .dailySeries(series)
                .build();
    }

    @Transactional(readOnly = true)
    @Override
    public List<ModelTrainingHistory> modelHistory() {
        return trainingHistoryRepository.findAll();
    }

    @Transactional(readOnly = true)
    @Override
    public AiStatusResponse getAiStatus() {
        JsonNode health = aiClient.health();
        boolean aiOnline = health != null && "ok".equalsIgnoreCase(health.path("status").asText(""));
        ModelTrainingHistory latest = trainingHistoryRepository.findTopByOrderByTrainedAtDesc().orElse(null);
        long totalForecasts = forecastResultRepository.count();

        return AiStatusResponse.builder()
                .aiOnline(aiOnline)
                .modelLoaded(health != null && health.path("model_loaded").asBoolean(false))
                .aiVersion(health != null ? health.path("version").asText("unknown") : "unknown")
                .lastTrainedAt(latest != null ? latest.getTrainedAt() : null)
                .modelType(latest != null ? latest.getModelType() : null)
                .totalForecasts(totalForecasts)
                .build();
    }

    @Transactional(readOnly = true)
    @Override
    public java.util.Map<String, Object> getModelMetrics() {
        try {
            JsonNode metrics = aiClient.metrics();
            if (metrics == null) {
                return java.util.Map.of("available", false);
            }
            return new com.fasterxml.jackson.databind.ObjectMapper().convertValue(
                    metrics, new com.fasterxml.jackson.core.type.TypeReference<java.util.Map<String, Object>>() {});
        } catch (Exception e) {
            return java.util.Map.of("available", false, "message", e.getMessage());
        }
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
        LocalDateTime since = LocalDateTime.now().minusDays(90);
        List<Order> orders = orderRepository.findCompletedSince(OrderStatus.COMPLETED, since);
        Map<Long, List<Map<String, Object>>> byItem = new LinkedHashMap<>();

        for (Order o : orders) {
            String date = o.getOrderDate().toLocalDate().toString();
            for (OrderItem oi : o.getItems()) {
                Item item = oi.getItem();
                Long itemId = item.getId();
                long categoryId = item.getCategory() != null ? item.getCategory().getId() : 1L;

                Map<String, Object> sale = new LinkedHashMap<>();
                sale.put("item_id", itemId);
                sale.put("sale_date", date);
                sale.put("quantity", oi.getQuantity().doubleValue());
                sale.put("category_id", categoryId);
                byItem.computeIfAbsent(itemId, k -> new ArrayList<>()).add(sale);
            }
        }

        List<Map<String, Object>> items = new ArrayList<>();
        for (Item item : itemRepository.findByActiveTrue()) {
            Map<String, Object> itemPayload = new LinkedHashMap<>();
            Long itemId = item.getId();
            long categoryId = item.getCategory() != null ? item.getCategory().getId() : 1L;
            itemPayload.put("item_id", itemId);
            itemPayload.put("category_id", categoryId);
            itemPayload.put("recent_sales", byItem.getOrDefault(itemId, List.of()));
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

    private ForecastResultResponse toResultResponse(ForecastResult fr) {
        Item item = fr.getItem();
        Map<String, Object> insight = buildStockInsight(item, fr.getPredictedQty30d(), fr.getPredictedQty7d());
        return ForecastResultResponse.builder()
                .itemId(item.getId())
                .itemCode(item.getItemCode())
                .itemName(item.getItemName())
                .pred7d(fr.getPredictedQty7d())
                .pred14d(fr.getPredictedQty14d())
                .pred30d(fr.getPredictedQty30d())
                .modelType(fr.getModelType())
                .forecastDate(fr.getForecastDate())
                .confidenceLow(fr.getConfidenceLow())
                .confidenceHigh(fr.getConfidenceHigh())
                .stockOnHand((BigDecimal) insight.get("stockOnHand"))
                .shortageQty((BigDecimal) insight.get("shortageQty"))
                .surplusQty((BigDecimal) insight.get("surplusQty"))
                .riskLevel((String) insight.get("riskLevel"))
                .recommendation((String) insight.get("recommendation"))
                .build();
    }

    private Map<String, Object> buildStockInsight(Item item, BigDecimal pred30d, BigDecimal pred7d) {
        BigDecimal stock = currentInventoryRepository.sumAvailableByItemId(item.getId()).orElse(BigDecimal.ZERO);
        BigDecimal pred30 = pred30d != null ? pred30d : BigDecimal.ZERO;
        BigDecimal pred7 = pred7d != null ? pred7d : BigDecimal.ZERO;
        BigDecimal minStock = item.getMinimumStock() != null
                ? BigDecimal.valueOf(item.getMinimumStock())
                : BigDecimal.ZERO;

        BigDecimal shortage = pred30.compareTo(stock) > 0
                ? pred30.subtract(stock).setScale(0, RoundingMode.CEILING)
                : BigDecimal.ZERO;
        BigDecimal surplus = stock.compareTo(pred30) > 0
                ? stock.subtract(pred30).setScale(0, RoundingMode.FLOOR)
                : BigDecimal.ZERO;

        String riskLevel;
        String recommendation;
        if (shortage.compareTo(BigDecimal.ZERO) == 0 && surplus.compareTo(pred7.multiply(BigDecimal.valueOf(2))) > 0) {
            riskLevel = "OVERSTOCK";
            recommendation = "Tồn dư ~" + surplus.toPlainString() + " sp — cân nhắc khuyến mãi hoặc giảm nhập";
        } else if (shortage.compareTo(BigDecimal.ZERO) == 0) {
            riskLevel = "OK";
            recommendation = "Tồn đủ cho nhu cầu 30 ngày tới";
        } else if (stock.compareTo(minStock) < 0 || shortage.compareTo(pred7) > 0) {
            riskLevel = "CRITICAL";
            recommendation = "Cần nhập gấp — thiếu ~" + shortage.toPlainString() + " sp so với dự báo 30 ngày";
        } else {
            riskLevel = "WARNING";
            recommendation = "Nên đặt hàng — thiếu ~" + shortage.toPlainString() + " sp trong 30 ngày tới";
        }

        Map<String, Object> insight = new LinkedHashMap<>();
        insight.put("stockOnHand", stock.setScale(0, RoundingMode.HALF_UP));
        insight.put("shortageQty", shortage);
        insight.put("surplusQty", surplus);
        insight.put("riskLevel", riskLevel);
        insight.put("recommendation", recommendation);
        return insight;
    }

    private static int riskSortOrder(String riskLevel) {
        return switch (riskLevel) {
            case "CRITICAL" -> 0;
            case "WARNING" -> 1;
            case "OK" -> 2;
            case "OVERSTOCK" -> 3;
            default -> 4;
        };
    }
}
