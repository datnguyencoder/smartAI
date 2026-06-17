package com.smartmart.service.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartmart.client.AiClient;
import com.smartmart.entity.Category;
import com.smartmart.entity.Item;
import com.smartmart.repository.ForecastDailyPointRepository;
import com.smartmart.repository.ForecastResultRepository;
import com.smartmart.repository.ItemRepository;
import com.smartmart.repository.ModelTrainingHistoryRepository;
import com.smartmart.repository.OrderRepository;
import com.smartmart.service.ai.impl.ForecastOrchestrationServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ForecastOrchestrationServiceTest {

    @Mock
    private AiClient aiClient;
    @Mock
    private OrderRepository orderRepository;
    @Mock
    private ItemRepository itemRepository;
    @Mock
    private ModelTrainingHistoryRepository trainingHistoryRepository;
    @Mock
    private ForecastResultRepository forecastResultRepository;
    @Mock
    private ForecastDailyPointRepository forecastDailyPointRepository;
    @Mock
    private ReorderRecommendationService reorderRecommendationService;

    private ForecastOrchestrationService service;

    @BeforeEach
    void setUp() {
        service = new ForecastOrchestrationServiceImpl(
                aiClient,
                orderRepository,
                itemRepository,
                trainingHistoryRepository,
                forecastResultRepository,
                forecastDailyPointRepository,
                reorderRecommendationService,
                new ObjectMapper()
        );
    }

    @Test
    void runForecast_submitsActiveItemsWithoutRecentSales() throws Exception {
        Category category = Category.builder().categoryName("Sữa").build();
        category.setId(7L);
        Item activeItem = Item.builder()
                .itemName("SKU mới")
                .itemCode("NEW-001")
                .category(category)
                .costPrice(BigDecimal.TEN)
                .sellingPrice(BigDecimal.valueOf(12))
                .minimumStock(1)
                .active(true)
                .build();
        activeItem.setId(99L);

        when(orderRepository.findCompletedSince(any(), any())).thenReturn(List.of());
        when(itemRepository.findByActiveTrue()).thenReturn(List.of(activeItem));
        when(aiClient.forecastAll(any())).thenReturn(new ObjectMapper().readTree("{\"forecasts\":[]}"));
        when(trainingHistoryRepository.findTopByOrderByTrainedAtDesc()).thenReturn(Optional.empty());
        when(forecastResultRepository.findAll()).thenReturn(List.of());

        Map<String, Object> result = service.runForecast();

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<Map<String, Object>>> captor = ArgumentCaptor.forClass(List.class);
        verify(aiClient).forecastAll(captor.capture());

        assertThat(result).containsEntry("itemsSubmitted", 1);
        assertThat(captor.getValue()).hasSize(1);
        assertThat(captor.getValue().getFirst())
                .containsEntry("item_id", 99L)
                .containsEntry("category_id", 7L);
        assertThat((List<?>) captor.getValue().getFirst().get("recent_sales")).isEmpty();
    }
}
