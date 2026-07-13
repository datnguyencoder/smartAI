package com.smartmart.service.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.smartmart.dto.response.InventoryAlertResponse;
import com.smartmart.entity.ForecastResult;
import com.smartmart.entity.Item;
import com.smartmart.entity.ReorderRecommendation;
import com.smartmart.repository.ForecastResultRepository;
import com.smartmart.repository.ItemRepository;
import com.smartmart.repository.ReorderRecommendationRepository;
import com.smartmart.service.DashboardService;
import com.smartmart.service.InventoryAlertService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Định nghĩa "tools" (function declarations) mà Gemini agent có thể gọi, và dispatch
 * lời gọi đó vào service/repository thật của hệ thống — biến AI chat từ chatbot chỉ
 * đọc prompt tĩnh thành agent có thể tự truy vấn dữ liệu vận hành real-time.
 *
 * Mỗi tool chỉ đọc dữ liệu (read-only) — agent không được phép ghi/thay đổi dữ liệu
 * nghiệp vụ (đúng nguyên tắc "LLM chỉ đề xuất, không tự quyết định giao dịch" ở
 * docs/13-business-flow-blueprint.md mục 13).
 */
@Component
public class AiToolExecutor {

    private static final Logger log = LoggerFactory.getLogger(AiToolExecutor.class);

    private final ItemRepository itemRepository;
    private final ForecastResultRepository forecastResultRepository;
    private final InventoryAlertService inventoryAlertService;
    private final ReorderRecommendationRepository reorderRecommendationRepository;
    private final DashboardService dashboardService;
    private final VectorSearchService vectorSearchService;
    private final ObjectMapper objectMapper;

    public AiToolExecutor(
            ItemRepository itemRepository,
            ForecastResultRepository forecastResultRepository,
            InventoryAlertService inventoryAlertService,
            ReorderRecommendationRepository reorderRecommendationRepository,
            DashboardService dashboardService,
            VectorSearchService vectorSearchService,
            ObjectMapper objectMapper) {
        this.itemRepository = itemRepository;
        this.forecastResultRepository = forecastResultRepository;
        this.inventoryAlertService = inventoryAlertService;
        this.reorderRecommendationRepository = reorderRecommendationRepository;
        this.dashboardService = dashboardService;
        this.vectorSearchService = vectorSearchService;
        this.objectMapper = objectMapper;
    }

    /** Danh sách "functionDeclarations" gửi kèm request Gemini (Gemini v1beta tools schema). */
    public ArrayNode buildToolDeclarations() {
        ArrayNode functions = objectMapper.createArrayNode();
        functions.add(declaration("search_item",
                "Tìm sản phẩm theo tên hoặc mã SKU đang kinh doanh trong cửa hàng.",
                Map.of("query", "Từ khóa tên hoặc mã sản phẩm cần tìm")));
        functions.add(declaration("get_item_forecast",
                "Lấy dự báo nhu cầu 7/14/30 ngày và tồn kho hiện tại của một sản phẩm theo itemId.",
                Map.of("itemId", "ID số của sản phẩm (lấy từ search_item)")));
        functions.add(declarationNoParams("get_low_stock_alerts",
                "Lấy danh sách cảnh báo tồn kho đang mở (hết hàng, tồn thấp, cận date, rủi ro thiếu hàng)."));
        functions.add(declarationNoParams("get_reorder_recommendations",
                "Lấy danh sách gợi ý đặt hàng nhập kho đang chờ xử lý (từ AI forecast), sắp theo số lượng đề xuất."));
        functions.add(declarationNoParams("get_dashboard_summary",
                "Lấy số liệu tổng quan cửa hàng hôm nay: doanh thu, số đơn, tồn kho, cảnh báo."));
        functions.add(declaration("search_store_policy",
                "Tìm kiếm ngữ nghĩa (RAG) trong tài liệu quy tắc nghiệp vụ và chính sách cửa hàng "
                        + "(đổi trả, bảo mật, phân quyền...) để trả lời câu hỏi về chính sách.",
                Map.of("query", "Câu hỏi hoặc chủ đề chính sách cần tra cứu")));

        ArrayNode tools = objectMapper.createArrayNode();
        tools.addObject().set("functionDeclarations", functions);
        return tools;
    }

    private ObjectNode declaration(String name, String description, Map<String, String> params) {
        ObjectNode fn = objectMapper.createObjectNode();
        fn.put("name", name);
        fn.put("description", description);
        ObjectNode parameters = fn.putObject("parameters");
        parameters.put("type", "OBJECT");
        ObjectNode properties = parameters.putObject("properties");
        ArrayNode required = parameters.putArray("required");
        params.forEach((key, desc) -> {
            ObjectNode prop = properties.putObject(key);
            prop.put("type", key.toLowerCase().contains("id") ? "INTEGER" : "STRING");
            prop.put("description", desc);
            required.add(key);
        });
        return fn;
    }

    private ObjectNode declarationNoParams(String name, String description) {
        ObjectNode fn = objectMapper.createObjectNode();
        fn.put("name", name);
        fn.put("description", description);
        ObjectNode parameters = fn.putObject("parameters");
        parameters.put("type", "OBJECT");
        parameters.putObject("properties");
        return fn;
    }

    /** Thực thi tool theo tên + tham số JSON mà Gemini trả về, trả kết quả dạng Map để nhét vào functionResponse. */
    public Object dispatch(String toolName, JsonNode args) {
        try {
            return switch (toolName) {
                case "search_item" -> searchItem(args.path("query").asText(""));
                case "get_item_forecast" -> getItemForecast(args.path("itemId").asLong(-1));
                case "get_low_stock_alerts" -> getLowStockAlerts();
                case "get_reorder_recommendations" -> getReorderRecommendations();
                case "get_dashboard_summary" -> dashboardService.summary();
                case "search_store_policy" -> searchStorePolicy(args.path("query").asText(""));
                default -> Map.of("error", "Không hỗ trợ tool: " + toolName);
            };
        } catch (Exception ex) {
            log.warn("AI tool '{}' lỗi: {}", toolName, ex.getMessage());
            return Map.of("error", "Không thể lấy dữ liệu cho tool " + toolName);
        }
    }

    private List<Map<String, Object>> searchItem(String query) {
        return itemRepository.searchActive(query).stream()
                .limit(5)
                .map(this::itemSummary)
                .toList();
    }

    private Map<String, Object> itemSummary(Item item) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("itemId", item.getId());
        map.put("itemCode", item.getItemCode());
        map.put("itemName", item.getItemName());
        map.put("sellingPrice", item.getSellingPrice());
        map.put("active", item.isActive());
        return map;
    }

    private Map<String, Object> getItemForecast(long itemId) {
        if (itemId <= 0) {
            return Map.of("error", "Thiếu itemId hợp lệ, hãy gọi search_item trước để lấy itemId.");
        }
        Item item = itemRepository.findById(itemId).orElse(null);
        if (item == null) {
            return Map.of("error", "Không tìm thấy sản phẩm id=" + itemId);
        }
        ForecastResult forecast = forecastResultRepository
                .findFirstByItemIdOrderByForecastDateDesc(itemId).orElse(null);
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("itemName", item.getItemName());
        if (forecast == null) {
            map.put("forecast", "Chưa có dữ liệu dự báo cho sản phẩm này.");
            return map;
        }
        map.put("predictedQty7d", forecast.getPredictedQty7d());
        map.put("predictedQty14d", forecast.getPredictedQty14d());
        map.put("predictedQty30d", forecast.getPredictedQty30d());
        map.put("modelType", forecast.getModelType());
        map.put("forecastDate", forecast.getForecastDate());
        return map;
    }

    private List<Map<String, Object>> getLowStockAlerts() {
        List<InventoryAlertResponse> alerts = inventoryAlertService.listUnresolved();
        return alerts.stream().limit(10).map(a -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("itemName", a.getItemName());
            map.put("alertType", a.getAlertType());
            map.put("severity", a.getSeverity());
            map.put("currentStock", a.getCurrentStock());
            map.put("message", a.getMessage());
            return map;
        }).toList();
    }

    private List<Map<String, Object>> getReorderRecommendations() {
        List<ReorderRecommendation> recs = reorderRecommendationRepository
                .findByStatusOrderBySuggestedQtyDesc("ACTIVE");
        return recs.stream().limit(10).map(r -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("itemName", r.getItem().getItemName());
            map.put("suggestedQty", r.getSuggestedQty());
            map.put("riskLevel", r.getRiskLevel());
            map.put("reason", r.getReason());
            return map;
        }).toList();
    }

    private Object searchStorePolicy(String query) {
        if (query.isBlank()) {
            return Map.of("error", "Thiếu nội dung câu hỏi để tra cứu chính sách.");
        }
        List<RetrievedChunk> chunks = vectorSearchService.search(query, 4);
        if (chunks.isEmpty()) {
            return Map.of("result", "Không tìm thấy nội dung chính sách liên quan.");
        }
        return chunks.stream()
                .map(c -> Map.of("source", c.sourceRef(), "content", c.content(), "relevance", c.score()))
                .toList();
    }
}
