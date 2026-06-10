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

        if (forecasts.isEmpty()) {
            recomputeFallbackFromSalesAverage();
            return;
        }

        for (ForecastResult fr : forecasts) {
            BigDecimal pred14 = fr.getPredictedQty14d() != null ? fr.getPredictedQty14d() : BigDecimal.ZERO;
            saveRecommendation(
                    fr.getItem(),
                    pred14,
                    "AI",
                    "Calculated from ML forecast (14d demand)"
            );
        }
    }

    private void recomputeFallbackFromSalesAverage() {
        LocalDateTime since = LocalDateTime.now().minusDays(30);
        Map<Long, BigDecimal> soldByItem = new HashMap<>();
        for (Object[] row : orderItemRepository.sumSalesByItemSince(since)) {
            Long itemId = ((Number) row[0]).longValue();
            BigDecimal totalSold = BigDecimal.valueOf(((Number) row[1]).doubleValue());
            soldByItem.put(itemId, totalSold.divide(BigDecimal.valueOf(30), 4, RoundingMode.HALF_UP));
        }

        for (Item item : itemRepository.findAll()) {
            BigDecimal avgDaily = soldByItem.getOrDefault(item.getId(), BigDecimal.ZERO);
            BigDecimal pred14 = avgDaily.multiply(BigDecimal.valueOf(14));
            saveRecommendation(
                    item,
                    pred14,
                    "FALLBACK",
                    "AI offline - calculated from 30d average (14d demand)"
            );
        }
    }

    private void saveRecommendation(Item item, BigDecimal predictedDemand, String source, String reason) {
        BigDecimal available = currentInventoryRepository.sumAvailableByItemId(item.getId())
                .orElse(BigDecimal.ZERO);
        BigDecimal safety = BigDecimal.valueOf(item.getMinimumStock());
        BigDecimal suggested = predictedDemand.add(safety).subtract(available).max(BigDecimal.ZERO);

        String risk = available.compareTo(predictedDemand) < 0 ? "HIGH"
                : available.compareTo(predictedDemand.add(safety)) < 0 ? "MEDIUM" : "LOW";

        reorderRepository.save(ReorderRecommendation.builder()
                .item(item)
                .suggestedQty(suggested.setScale(2, RoundingMode.HALF_UP))
                .currentAvailable(available)
                .predictedDemand7d(predictedDemand.setScale(2, RoundingMode.HALF_UP))
                .riskLevel(risk)
                .source(source)
                .reason(reason)
                .status("ACTIVE")
                .build());
    }

    @Transactional(readOnly = true)
    @Override
    public List<Map<String, Object>> listActive() {
        return reorderRepository.findByStatusOrderBySuggestedQtyDesc("ACTIVE").stream()
                .map(r -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("itemId", r.getItem().getId());
                    m.put("itemName", r.getItem().getItemName());
                    m.put("suggestedQty", r.getSuggestedQty());
                    m.put("currentAvailable", r.getCurrentAvailable());
                    m.put("predictedDemand14d", r.getPredictedDemand7d());
                    m.put("predictedDemand7d", r.getPredictedDemand7d());
                    m.put("riskLevel", r.getRiskLevel());
                    m.put("source", r.getSource());
                    m.put("reason", r.getReason());
                    return m;
                })
                .toList();
    }
}
