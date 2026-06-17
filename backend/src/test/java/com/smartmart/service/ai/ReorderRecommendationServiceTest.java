package com.smartmart.service.ai;

import com.smartmart.entity.Item;
import com.smartmart.entity.ReorderRecommendation;
import com.smartmart.repository.CurrentInventoryRepository;
import com.smartmart.repository.ForecastResultRepository;
import com.smartmart.repository.ItemRepository;
import com.smartmart.repository.OrderItemRepository;
import com.smartmart.repository.ReorderRecommendationRepository;
import com.smartmart.service.impl.ReorderRecommendationServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReorderRecommendationServiceTest {

    @Mock
    private ReorderRecommendationRepository reorderRepository;
    @Mock
    private ForecastResultRepository forecastResultRepository;
    @Mock
    private ItemRepository itemRepository;
    @Mock
    private CurrentInventoryRepository currentInventoryRepository;
    @Mock
    private OrderItemRepository orderItemRepository;

    private ReorderRecommendationService service;

    @BeforeEach
    void setUp() {
        service = new ReorderRecommendationServiceImpl(
                reorderRepository,
                forecastResultRepository,
                itemRepository,
                currentInventoryRepository,
                orderItemRepository
        );
    }

    @Test
    void listActive_returnsSeparateSevenAndFourteenDayDemand() {
        Item item = Item.builder().itemName("Sữa tươi").build();
        item.setId(12L);
        ReorderRecommendation recommendation = ReorderRecommendation.builder()
                .item(item)
                .suggestedQty(BigDecimal.valueOf(20))
                .currentAvailable(BigDecimal.valueOf(5))
                .predictedDemand7d(BigDecimal.valueOf(7))
                .predictedDemand14d(BigDecimal.valueOf(14))
                .riskLevel("HIGH")
                .source("AI")
                .reason("test")
                .status("ACTIVE")
                .build();

        when(reorderRepository.findByStatusOrderBySuggestedQtyDesc("ACTIVE"))
                .thenReturn(List.of(recommendation));

        List<Map<String, Object>> rows = service.listActive();

        assertThat(rows).hasSize(1);
        assertThat(rows.getFirst())
                .containsEntry("predictedDemand7d", BigDecimal.valueOf(7))
                .containsEntry("predictedDemand14d", BigDecimal.valueOf(14));
    }
}
