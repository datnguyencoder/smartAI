package com.smartmart.service.ai;

import com.smartmart.entity.ForecastResult;
import com.smartmart.entity.Item;
import com.smartmart.entity.ItemLot;
import com.smartmart.exception.NotFoundException;
import com.smartmart.repository.CurrentInventoryRepository;
import com.smartmart.repository.ForecastResultRepository;
import com.smartmart.repository.ItemLotRepository;
import com.smartmart.repository.ItemRepository;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.Map;

@Component
public class GeminiContextBuilder {

    private final ItemRepository itemRepository;
    private final CurrentInventoryRepository currentInventoryRepository;
    private final ForecastResultRepository forecastResultRepository;
    private final ItemLotRepository itemLotRepository;

    public GeminiContextBuilder(
            ItemRepository itemRepository,
            CurrentInventoryRepository currentInventoryRepository,
            ForecastResultRepository forecastResultRepository,
            ItemLotRepository itemLotRepository
    ) {
        this.itemRepository = itemRepository;
        this.currentInventoryRepository = currentInventoryRepository;
        this.forecastResultRepository = forecastResultRepository;
        this.itemLotRepository = itemLotRepository;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> buildItemContext(Long itemId) {
        Item item = itemRepository.findById(itemId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy sản phẩm"));

        BigDecimal available = currentInventoryRepository.sumAvailableByItemId(item.getId())
                .orElse(BigDecimal.ZERO);

        ForecastResult forecast = forecastResultRepository
                .findFirstByItemIdOrderByForecastDateDesc(item.getId())
                .orElse(null);

        LocalDate nearestExpiry = itemLotRepository.findByItemIdOrderByFefo(item.getId()).stream()
                .map(ItemLot::getExpiryDate)
                .filter(d -> d != null && !d.isBefore(LocalDate.now()))
                .findFirst()
                .orElse(null);

        Map<String, Object> ctx = new LinkedHashMap<>();
        ctx.put("productName", item.getItemName());
        ctx.put("categoryName", item.getCategory() != null ? item.getCategory().getCategoryName() : "N/A");
        ctx.put("currentStock", available);
        ctx.put("unit", item.getBaseUom() != null ? item.getBaseUom().getUomName() : "cái");
        ctx.put("minStockLevel", item.getMinimumStock());
        ctx.put("importPrice", item.getCostPrice());
        ctx.put("sellingPrice", item.getSellingPrice());
        ctx.put("predicted7d", forecast != null ? forecast.getPredictedQty7d() : BigDecimal.ZERO);
        ctx.put("predicted14d", forecast != null ? forecast.getPredictedQty14d() : BigDecimal.ZERO);
        ctx.put("predicted30d", forecast != null ? forecast.getPredictedQty30d() : BigDecimal.ZERO);
        ctx.put("modelType", forecast != null ? forecast.getModelType() : "N/A");
        ctx.put("hasExpiry", item.isHasExpiry());
        ctx.put("expiryDate", nearestExpiry != null ? nearestExpiry.toString() : "Không có / không áp dụng");
        return ctx;
    }

    public String buildExplainPrompt(Map<String, Object> ctx) {
        return """
                Hãy phân tích sản phẩm sau:
                - Tên sản phẩm: %s | Danh mục: %s
                - Tồn kho thực tế: %s %s | Ngưỡng tối thiểu: %s %s
                - Giá nhập: %s VND | Giá bán: %s VND
                - Dự báo ML: 7 ngày=%s, 14 ngày=%s, 30 ngày=%s | Model: %s
                - HSD lô gần nhất: %s (hasExpiry=%s)

                Yêu cầu phân tích:
                1. Đánh giá trạng thái tồn kho (đủ/thiếu/ứ đọng).
                2. Giải thích ý nghĩa dự báo học máy.
                3. Khuyến nghị nhập hàng cụ thể (số lượng, thời điểm).
                4. Nếu cận date, đề xuất khuyến mãi (%% giảm hoặc combo).

                %s
                """.formatted(
                ctx.get("productName"),
                ctx.get("categoryName"),
                ctx.get("currentStock"),
                ctx.get("unit"),
                ctx.get("minStockLevel"),
                ctx.get("unit"),
                ctx.get("importPrice"),
                ctx.get("sellingPrice"),
                ctx.get("predicted7d"),
                ctx.get("predicted14d"),
                ctx.get("predicted30d"),
                ctx.get("modelType"),
                ctx.get("expiryDate"),
                ctx.get("hasExpiry"),
                AiTextSanitizer.STYLE_RULES
        );
    }

    public String buildPromotionPrompt(Map<String, Object> ctx) {
        return """
                Sản phẩm cần xử lý khuyến mãi:
                - Tên: %s | Danh mục: %s
                - Tồn: %s %s | Giá bán: %s VND
                - HSD lô gần nhất: %s
                - Dự báo 7 ngày: %s

                Đề xuất chương trình KM cụ thể: %% giảm, thời hạn, combo bán kèm.

                %s
                """.formatted(
                ctx.get("productName"),
                ctx.get("categoryName"),
                ctx.get("currentStock"),
                ctx.get("unit"),
                ctx.get("sellingPrice"),
                ctx.get("expiryDate"),
                ctx.get("predicted7d"),
                AiTextSanitizer.STYLE_RULES
        );
    }
}
