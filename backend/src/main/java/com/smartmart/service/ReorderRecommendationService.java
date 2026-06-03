package com.smartmart.service;

import com.smartmart.entity.ForecastResult;
import com.smartmart.entity.Item;
import com.smartmart.entity.ReorderRecommendation;
import com.smartmart.repository.CurrentInventoryRepository;
import com.smartmart.repository.ForecastResultRepository;
import com.smartmart.repository.ItemRepository;
import com.smartmart.repository.ReorderRecommendationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class ReorderRecommendationService {

    private final ReorderRecommendationRepository reorderRepository;
    private final ForecastResultRepository forecastResultRepository;
    private final ItemRepository itemRepository;
    private final CurrentInventoryRepository currentInventoryRepository;

    public ReorderRecommendationService(
            ReorderRecommendationRepository reorderRepository,
            ForecastResultRepository forecastResultRepository,
            ItemRepository itemRepository,
            CurrentInventoryRepository currentInventoryRepository
    ) {
        this.reorderRepository = reorderRepository;
        this.forecastResultRepository = forecastResultRepository;
        this.itemRepository = itemRepository;
        this.currentInventoryRepository = currentInventoryRepository;
    }

    @Transactional
    public void recomputeFromForecasts() {
        reorderRepository.deleteAll();
        List<ForecastResult> forecasts = forecastResultRepository.findAll();
        for (ForecastResult fr : forecasts) {
            Item item = fr.getItem();
            BigDecimal available = currentInventoryRepository.sumAvailableByItemId(item.getId())
                    .orElse(BigDecimal.ZERO);
            BigDecimal pred7 = fr.getPredictedQty7d() != null ? fr.getPredictedQty7d() : BigDecimal.ZERO;
            BigDecimal safety = BigDecimal.valueOf(item.getMinimumStock());
            BigDecimal suggested = pred7.add(safety).subtract(available).max(BigDecimal.ZERO);

            String risk = available.compareTo(pred7) < 0 ? "HIGH"
                    : available.compareTo(pred7.add(safety)) < 0 ? "MEDIUM" : "LOW";

            reorderRepository.save(ReorderRecommendation.builder()
                    .item(item)
                    .suggestedQty(suggested.setScale(2, RoundingMode.HALF_UP))
                    .currentAvailable(available)
                    .predictedDemand7d(pred7)
                    .riskLevel(risk)
                    .status("ACTIVE")
                    .build());
        }
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> listActive() {
        return reorderRepository.findByStatusOrderBySuggestedQtyDesc("ACTIVE").stream()
                .map(r -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("itemId", r.getItem().getId());
                    m.put("itemName", r.getItem().getItemName());
                    m.put("suggestedQty", r.getSuggestedQty());
                    m.put("currentAvailable", r.getCurrentAvailable());
                    m.put("predictedDemand7d", r.getPredictedDemand7d());
                    m.put("riskLevel", r.getRiskLevel());
                    return m;
                })
                .toList();
    }
}
