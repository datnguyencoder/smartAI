package com.smartmart.service.ai.impl;

import com.smartmart.entity.ForecastResult;
import com.smartmart.entity.Item;
import com.smartmart.entity.ReorderRecommendation;
import com.smartmart.repository.CurrentInventoryRepository;
import com.smartmart.repository.ForecastResultRepository;
import com.smartmart.repository.ItemRepository;
import com.smartmart.repository.OrderItemRepository;
import com.smartmart.repository.ReorderRecommendationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class ReorderRecommendationServiceImpl implements com.smartmart.service.ai.ReorderRecommendationService {

    private static final int MAX_LEAD_TIME_DAYS = 7;
    private static final int AVG_LEAD_TIME_DAYS = 3;
    private static final int SALES_WINDOW_DAYS = 30;

    private final ReorderRecommendationRepository reorderRepository;
    private final ForecastResultRepository forecastResultRepository;
    private final ItemRepository itemRepository;
    private final CurrentInventoryRepository currentInventoryRepository;
    private final OrderItemRepository orderItemRepository;

    public ReorderRecommendationServiceImpl(
            ReorderRecommendationRepository reorderRepository,
            ForecastResultRepository forecastResultRepository,
            ItemRepository itemRepository,
            CurrentInventoryRepository currentInventoryRepository,
            OrderItemRepository orderItemRepository
    ) {
        this.reorderRepository = reorderRepository;
        this.forecastResultRepository = forecastResultRepository;
        this.itemRepository = itemRepository;
        this.currentInventoryRepository = currentInventoryRepository;
        this.orderItemRepository = orderItemRepository;
    }

    @Transactional
    @Override
    public void recomputeFromForecasts() {
        reorderRepository.deleteAll();
        List<ForecastResult> forecasts = forecastResultRepository.findAll();

        Map<Long, BigDecimal> avgDailyByItem = loadAvgDailySales();
        Map<Long, BigDecimal> maxDailyByItem = loadMaxDailySales();

        if (forecasts.isEmpty()) {
            recomputeFallbackFromSalesAverage(avgDailyByItem, maxDailyByItem);
            return;
        }

        for (ForecastResult fr : forecasts) {
            BigDecimal pred14 = fr.getPredictedQty14d() != null ? fr.getPredictedQty14d() : BigDecimal.ZERO;
            BigDecimal pred7 = fr.getPredictedQty7d() != null ? fr.getPredictedQty7d() : pred14;
            saveRecommendation(
                    fr.getItem(),
                    pred14,
                    pred7,
                    avgDailyByItem,
                    maxDailyByItem,
                    "AI",
                    "Calculated from ML forecast (14d demand)"
            );
        }
    }

    @Transactional
    @Override
    public void recomputeFallbackFromSalesAverage() {
        reorderRepository.deleteAll();
        recomputeFallbackFromSalesAverage(loadAvgDailySales(), loadMaxDailySales());
    }

    private void recomputeFallbackFromSalesAverage(
            Map<Long, BigDecimal> avgDailyByItem,
            Map<Long, BigDecimal> maxDailyByItem
    ) {
        for (Item item : itemRepository.findAll()) {
            BigDecimal avgDaily = avgDailyByItem.getOrDefault(item.getId(), BigDecimal.ZERO);
            BigDecimal pred14 = avgDaily.multiply(BigDecimal.valueOf(14));
            BigDecimal pred7 = avgDaily.multiply(BigDecimal.valueOf(7));
            saveRecommendation(
                    item,
                    pred14,
                    pred7,
                    avgDailyByItem,
                    maxDailyByItem,
                    "FALLBACK",
                    "AI offline - calculated from 30d average (14d demand)"
            );
        }
    }

    private Map<Long, BigDecimal> loadAvgDailySales() {
        LocalDateTime since = LocalDateTime.now().minusDays(SALES_WINDOW_DAYS);
        Map<Long, BigDecimal> soldByItem = new HashMap<>();
        for (Object[] row : orderItemRepository.sumSalesByItemSince(since)) {
            Long itemId = ((Number) row[0]).longValue();
            BigDecimal totalSold = BigDecimal.valueOf(((Number) row[1]).doubleValue());
            soldByItem.put(itemId, totalSold.divide(BigDecimal.valueOf(SALES_WINDOW_DAYS), 4, RoundingMode.HALF_UP));
        }
        return soldByItem;
    }

    private Map<Long, BigDecimal> loadMaxDailySales() {
        LocalDateTime since = LocalDateTime.now().minusDays(SALES_WINDOW_DAYS);
        Map<Long, BigDecimal> maxByItem = new HashMap<>();
        for (Object[] row : orderItemRepository.maxDailySalesByItemSince(since)) {
            maxByItem.put(((Number) row[0]).longValue(), BigDecimal.valueOf(((Number) row[1]).doubleValue()));
        }
        return maxByItem;
    }

    private BigDecimal computeSafetyStock(
            Long itemId,
            Map<Long, BigDecimal> avgDailyByItem,
            Map<Long, BigDecimal> maxDailyByItem
    ) {
        BigDecimal avgDaily = avgDailyByItem.getOrDefault(itemId, BigDecimal.ZERO);
        BigDecimal maxDaily = maxDailyByItem.getOrDefault(itemId, avgDaily);
        return maxDaily.multiply(BigDecimal.valueOf(MAX_LEAD_TIME_DAYS))
                .subtract(avgDaily.multiply(BigDecimal.valueOf(AVG_LEAD_TIME_DAYS)))
                .max(BigDecimal.ZERO);
    }

    private void saveRecommendation(
            Item item,
            BigDecimal predictedDemand14d,
            BigDecimal predictedDemand7d,
            Map<Long, BigDecimal> avgDailyByItem,
            Map<Long, BigDecimal> maxDailyByItem,
            String source,
            String reason
    ) {
        BigDecimal available = currentInventoryRepository.sumAvailableByItemId(item.getId())
                .orElse(BigDecimal.ZERO);
        BigDecimal safety = computeSafetyStock(item.getId(), avgDailyByItem, maxDailyByItem);
        BigDecimal suggested = predictedDemand14d.add(safety).subtract(available).max(BigDecimal.ZERO);

        String risk = available.compareTo(predictedDemand7d) < 0 ? "HIGH"
                : available.compareTo(predictedDemand7d.add(safety)) < 0 ? "MEDIUM" : "LOW";

        reorderRepository.save(ReorderRecommendation.builder()
                .item(item)
                .suggestedQty(suggested.setScale(2, RoundingMode.HALF_UP))
                .currentAvailable(available)
                .predictedDemand7d(predictedDemand7d.setScale(2, RoundingMode.HALF_UP))
                .predictedDemand14d(predictedDemand14d.setScale(2, RoundingMode.HALF_UP))
                .riskLevel(risk)
                .source(source)
                .reason(reason)
                .status("ACTIVE")
                .build());
    }

    @Transactional(readOnly = true)
    @Override
    public List<Map<String, Object>> listActive() {
        return reorderRepository
                .findByStatusAndSuggestedQtyGreaterThanOrderBySuggestedQtyDesc("ACTIVE", BigDecimal.ZERO)
                .stream()
                .map(r -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("itemId", r.getItem().getId());
                    m.put("itemCode", r.getItem().getItemCode());
                    m.put("itemName", r.getItem().getItemName());
                    m.put("suggestedQty", r.getSuggestedQty());
                    m.put("currentAvailable", r.getCurrentAvailable());
                    m.put("predictedDemand14d", r.getPredictedDemand14d());
                    m.put("predictedDemand7d", r.getPredictedDemand7d());
                    m.put("riskLevel", r.getRiskLevel());
                    m.put("source", r.getSource());
                    m.put("reason", r.getReason());
                    return m;
                })
                .toList();
    }
}
