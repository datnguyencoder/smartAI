package com.smartmart.service.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.smartmart.dto.response.InventoryAlertResponse;
import com.smartmart.entity.*;
import com.smartmart.repository.*;
import com.smartmart.service.DashboardService;
import com.smartmart.service.DiscountPlanService;
import com.smartmart.service.InventoryAlertService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Định nghĩa "tools" (function declarations) mà Gemini agent có thể gọi, và dispatch
 * lời gọi đó vào service/repository thật của hệ thống. Tất cả tool chỉ đọc (read-only).
 * Cần @Transactional vì một số tool (vd. get_reorder_recommendations) lazy-load quan hệ
 * JPA sau khi repository trả về — session phải còn mở khi map sang DTO.
 */
@Component
@Transactional(readOnly = true)
public class AiToolExecutor {

    private static final Logger log = LoggerFactory.getLogger(AiToolExecutor.class);

    private final ItemRepository itemRepository;
    private final ForecastResultRepository forecastResultRepository;
    private final InventoryAlertService inventoryAlertService;
    private final ReorderRecommendationRepository reorderRecommendationRepository;
    private final DashboardService dashboardService;
    private final VectorSearchService vectorSearchService;
    private final GeminiContextBuilder contextBuilder;
    private final CurrentInventoryRepository currentInventoryRepository;
    private final OrderRepository orderRepository;
    private final CustomerRepository customerRepository;
    private final PromotionRepository promotionRepository;
    private final DiscountPlanService discountPlanService;
    private final CategoryRepository categoryRepository;
    private final AiActionService aiActionService;
    private final ObjectMapper objectMapper;

    public AiToolExecutor(
            ItemRepository itemRepository,
            ForecastResultRepository forecastResultRepository,
            InventoryAlertService inventoryAlertService,
            ReorderRecommendationRepository reorderRecommendationRepository,
            DashboardService dashboardService,
            VectorSearchService vectorSearchService,
            GeminiContextBuilder contextBuilder,
            CurrentInventoryRepository currentInventoryRepository,
            OrderRepository orderRepository,
            CustomerRepository customerRepository,
            PromotionRepository promotionRepository,
            DiscountPlanService discountPlanService,
            CategoryRepository categoryRepository,
            AiActionService aiActionService,
            ObjectMapper objectMapper) {
        this.itemRepository = itemRepository;
        this.forecastResultRepository = forecastResultRepository;
        this.inventoryAlertService = inventoryAlertService;
        this.reorderRecommendationRepository = reorderRecommendationRepository;
        this.dashboardService = dashboardService;
        this.vectorSearchService = vectorSearchService;
        this.contextBuilder = contextBuilder;
        this.currentInventoryRepository = currentInventoryRepository;
        this.orderRepository = orderRepository;
        this.customerRepository = customerRepository;
        this.promotionRepository = promotionRepository;
        this.discountPlanService = discountPlanService;
        this.categoryRepository = categoryRepository;
        this.aiActionService = aiActionService;
        this.objectMapper = objectMapper;
    }

    public ArrayNode buildToolDeclarations() {
        ArrayNode functions = objectMapper.createArrayNode();

        // ── Tồn kho & sản phẩm ──────────────────────────────────────────────
        functions.add(declaration("search_item",
                "Tìm sản phẩm theo tên hoặc mã SKU. Trả về itemId, tên, giá bán, trạng thái.",
                Map.of("query", "Từ khóa tên hoặc mã sản phẩm cần tìm")));

        functions.add(declaration("get_item_detail",
                "Lấy chi tiết đầy đủ của một sản phẩm: tồn kho hiện tại, giá nhập/bán, " +
                "ngưỡng tối thiểu, dự báo 7/14/30 ngày, lô hàng gần hết hạn. " +
                "Dùng sau search_item để phân tích sâu.",
                Map.of("itemId", "ID số của sản phẩm (lấy từ search_item)")));

        functions.add(declarationNoParams("get_low_stock_alerts",
                "Lấy danh sách cảnh báo tồn kho đang mở: hết hàng, tồn thấp, cận hạn, rủi ro thiếu hàng."));

        functions.add(declaration("get_expiring_lots",
                "Liệt kê các lô hàng sắp hết hạn trong N ngày tới, kèm tồn và thông tin sản phẩm.",
                Map.of("days", "Số ngày tới cần kiểm tra hạn sử dụng (ví dụ: 30)")));

        // ── Bán hàng & doanh thu ─────────────────────────────────────────────
        functions.add(declarationNoParams("get_dashboard_summary",
                "Lấy số liệu tổng quan cửa hàng HÔM NAY: doanh thu, số đơn, lợi nhuận gộp, " +
                "số SKU tồn thấp, số lô cận hạn."));

        functions.add(declarationNoParams("get_revenue_trend",
                "Lấy doanh thu từng ngày trong 7 ngày gần nhất. Dùng để phân tích xu hướng " +
                "tăng/giảm, so sánh ngày tốt/xấu trong tuần."));

        functions.add(declaration("get_top_selling_items",
                "Lấy top sản phẩm bán chạy nhất theo số lượng và doanh thu trong N ngày gần nhất.",
                Map.of("days", "Khoảng thời gian N ngày (ví dụ: 7, 30)")));

        // ── Nhập hàng & gợi ý ───────────────────────────────────────────────
        functions.add(declarationNoParams("get_reorder_recommendations",
                "Lấy danh sách gợi ý đặt hàng nhập kho từ AI forecast đang chờ xử lý, " +
                "sắp theo số lượng đề xuất giảm dần."));

        // ── Khuyến mãi (đọc) ────────────────────────────────────────────────
        functions.add(declarationNoParams("get_active_promotions",
                "Lấy danh sách mã khuyến mãi và kế hoạch giảm giá đang hoạt động hôm nay " +
                "(discount plans theo SKU/danh mục và promotion codes đang chạy)."));

        functions.add(declarationNoParams("list_categories",
                "Liệt kê tất cả danh mục sản phẩm (id + tên). Gọi trước khi tạo chiến dịch KM " +
                "theo danh mục để lấy đúng categoryId."));

        // ── Khuyến mãi (hành động - GHI) ────────────────────────────────────
        ObjectNode createCampaign = declarationTyped("create_discount_campaign",
                "TẠO chiến dịch giảm giá tự động áp tại POS. Dùng cho: giảm % theo danh mục/sản phẩm, " +
                "mua X tặng Y (BOGO), xả hàng cận date. Với danh mục cần categoryId (từ list_categories); " +
                "với sản phẩm cần itemId (từ search_item). Loại BOGO cần buyQuantity + freeQuantity; " +
                "loại PERCENTAGE cần discountPercent. Luôn xác nhận lại tham số với người dùng trước khi gọi, " +
                "và báo rõ đã tạo gì sau khi thành công.");
        addParam(createCampaign, "planName", "STRING", "Tên chiến dịch, ví dụ 'Xả hàng cận date sữa'", true);
        addParam(createCampaign, "planType", "STRING", "CATEGORY (theo danh mục) hoặc SKU (theo 1 sản phẩm)", true);
        addParam(createCampaign, "dealType", "STRING", "PERCENTAGE (giảm %) hoặc BOGO (mua X tặng Y)", true);
        addParam(createCampaign, "categoryId", "INTEGER", "ID danh mục (bắt buộc nếu planType=CATEGORY)", false);
        addParam(createCampaign, "itemId", "INTEGER", "ID sản phẩm (bắt buộc nếu planType=SKU)", false);
        addParam(createCampaign, "discountPercent", "NUMBER", "% giảm 1-100 (bắt buộc nếu dealType=PERCENTAGE)", false);
        addParam(createCampaign, "buyQuantity", "INTEGER", "Số lượng mua (bắt buộc nếu dealType=BOGO)", false);
        addParam(createCampaign, "freeQuantity", "INTEGER", "Số lượng tặng (bắt buộc nếu dealType=BOGO)", false);
        addParam(createCampaign, "durationDays", "INTEGER", "Số ngày hiệu lực tính từ hôm nay (mặc định 14)", false);
        functions.add(createCampaign);

        ObjectNode createCode = declarationTyped("create_promo_code",
                "TẠO mã khuyến mãi (coupon) giảm % trên tổng đơn, khách nhập mã tại POS. " +
                "Xác nhận tham số trước khi gọi và báo lại mã đã tạo.");
        addParam(createCode, "name", "STRING", "Tên chương trình, ví dụ 'Giảm 10% cuối tuần'", true);
        addParam(createCode, "discountPercent", "NUMBER", "% giảm 1-100 trên tổng đơn", true);
        addParam(createCode, "code", "STRING", "Mã tùy chọn (bỏ trống để tự sinh)", false);
        addParam(createCode, "minOrder", "NUMBER", "Giá trị đơn tối thiểu để áp mã (mặc định 0)", false);
        addParam(createCode, "durationDays", "INTEGER", "Số ngày hiệu lực (mặc định 14)", false);
        functions.add(createCode);

        // ── Khách hàng ──────────────────────────────────────────────────────
        functions.add(declaration("search_customers",
                "Tìm kiếm khách hàng theo tên hoặc số điện thoại. Trả về điểm tích lũy, hạng thẻ.",
                Map.of("query", "Tên hoặc số điện thoại khách hàng")));

        // ── Chính sách & nghiệp vụ ───────────────────────────────────────────
        functions.add(declaration("search_store_policy",
                "Tìm kiếm ngữ nghĩa (RAG) trong tài liệu quy tắc nghiệp vụ và chính sách cửa hàng " +
                "(đổi trả, bảo mật, phân quyền, quy trình vận hành) để trả lời câu hỏi về chính sách.",
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
            prop.put("type", key.toLowerCase().contains("id") ? "INTEGER" :
                    key.equals("days") ? "INTEGER" : "STRING");
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

    /** Tạo declaration rỗng để bổ sung tham số có kiểu tường minh qua {@link #addParam}. */
    private ObjectNode declarationTyped(String name, String description) {
        ObjectNode fn = objectMapper.createObjectNode();
        fn.put("name", name);
        fn.put("description", description);
        ObjectNode parameters = fn.putObject("parameters");
        parameters.put("type", "OBJECT");
        parameters.putObject("properties");
        parameters.putArray("required");
        return fn;
    }

    private void addParam(ObjectNode declaration, String name, String type, String description, boolean required) {
        ObjectNode parameters = (ObjectNode) declaration.path("parameters");
        ObjectNode properties = (ObjectNode) parameters.path("properties");
        ObjectNode prop = properties.putObject(name);
        prop.put("type", type);
        prop.put("description", description);
        if (required) {
            ((ArrayNode) parameters.path("required")).add(name);
        }
    }

    public Object dispatch(String toolName, JsonNode args) {
        try {
            return switch (toolName) {
                case "search_item"              -> searchItem(args.path("query").asText(""));
                case "get_item_detail"          -> getItemDetail(args.path("itemId").asLong(-1));
                case "get_low_stock_alerts"     -> getLowStockAlerts();
                case "get_expiring_lots"        -> getExpiringLots(args.path("days").asInt(30));
                case "get_dashboard_summary"    -> dashboardService.summary();
                case "get_revenue_trend"        -> dashboardService.revenue7d();
                case "get_top_selling_items"    -> getTopSellingItems(args.path("days").asInt(7));
                case "get_reorder_recommendations" -> getReorderRecommendations();
                case "get_active_promotions"    -> getActivePromotions();
                case "list_categories"          -> listCategories();
                case "create_discount_campaign" -> createDiscountCampaign(args);
                case "create_promo_code"        -> createPromoCode(args);
                case "search_customers"         -> searchCustomers(args.path("query").asText(""));
                case "search_store_policy"      -> searchStorePolicy(args.path("query").asText(""));
                default -> Map.of("error", "Không hỗ trợ tool: " + toolName);
            };
        } catch (Exception ex) {
            log.warn("AI tool '{}' lỗi: {}", toolName, ex.getMessage());
            return Map.of("error", "Không thể lấy dữ liệu cho tool " + toolName + ": " + ex.getMessage());
        }
    }

    // ── Implementations ───────────────────────────────────────────────────────

    private List<Map<String, Object>> searchItem(String query) {
        return itemRepository.searchActive(query).stream()
                .limit(5)
                .map(item -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("itemId", item.getId());
                    m.put("itemCode", item.getItemCode());
                    m.put("itemName", item.getItemName());
                    m.put("sellingPrice", item.getSellingPrice());
                    m.put("category", item.getCategory() != null ? item.getCategory().getCategoryName() : null);
                    m.put("active", item.isActive());
                    return m;
                }).toList();
    }

    private Map<String, Object> getItemDetail(long itemId) {
        if (itemId <= 0) {
            return Map.of("error", "Thiếu itemId hợp lệ. Hãy gọi search_item trước để lấy itemId.");
        }
        try {
            return contextBuilder.buildItemContext(itemId);
        } catch (Exception ex) {
            return Map.of("error", "Không tìm thấy sản phẩm id=" + itemId);
        }
    }

    private List<Map<String, Object>> getLowStockAlerts() {
        return inventoryAlertService.listUnresolved().stream().limit(15).map(a -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("itemName", a.getItemName());
            m.put("alertType", a.getAlertType());
            m.put("severity", a.getSeverity());
            m.put("currentStock", a.getCurrentStock());
            m.put("message", a.getMessage());
            return m;
        }).toList();
    }

    private List<Map<String, Object>> getExpiringLots(int days) {
        LocalDate deadline = LocalDate.now().plusDays(Math.max(1, Math.min(days, 365)));
        return currentInventoryRepository.findNearExpiry(deadline).stream()
                .limit(20)
                .map(ci -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("itemName", ci.getItem().getItemName());
                    m.put("itemCode", ci.getItem().getItemCode());
                    m.put("lotNumber", ci.getLot() != null ? ci.getLot().getLotNumber() : null);
                    m.put("expiryDate", ci.getLot() != null ? ci.getLot().getExpiryDate() : null);
                    m.put("availableQty", ci.getQuantity().subtract(
                            ci.getReservedQuantity() != null ? ci.getReservedQuantity() : BigDecimal.ZERO));
                    m.put("location", ci.getLocation() != null ? ci.getLocation().getLocationName() : null);
                    return m;
                }).toList();
    }

    private List<Map<String, Object>> getTopSellingItems(int days) {
        LocalDateTime from = LocalDateTime.now().minusDays(Math.max(1, Math.min(days, 365)));
        LocalDateTime to = LocalDateTime.now();
        List<Object[]> rows = orderRepository.reportBestSellers(from, to, 10);
        return rows.stream().map(r -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("itemCode", r[1]);
            m.put("itemName", r[2]);
            m.put("quantitySold", r[3]);
            m.put("revenue", r[4]);
            return m;
        }).toList();
    }

    private List<Map<String, Object>> getReorderRecommendations() {
        return reorderRecommendationRepository.findByStatusOrderBySuggestedQtyDesc("ACTIVE")
                .stream().limit(10).map(r -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("itemName", r.getItem().getItemName());
                    m.put("suggestedQty", r.getSuggestedQty());
                    m.put("riskLevel", r.getRiskLevel());
                    m.put("reason", r.getReason());
                    return m;
                }).toList();
    }

    private Map<String, Object> getActivePromotions() {
        LocalDate today = LocalDate.now();

        List<Map<String, Object>> codes = promotionRepository
                .findByActiveTrueAndStartDateLessThanEqualAndEndDateGreaterThanEqual(today, today)
                .stream().map(p -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("name", p.getName());
                    m.put("code", p.getCode());
                    m.put("type", p.getType());
                    m.put("value", p.getValue());
                    m.put("minOrder", p.getMinOrder());
                    m.put("endDate", p.getEndDate());
                    return m;
                }).toList();

        List<Map<String, Object>> plans = discountPlanService.listActiveToday().stream().map(dp -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("planName", dp.getPlanName());
            m.put("planType", dp.getPlanType());
            m.put("target", dp.getItemName() != null ? dp.getItemName() : dp.getCategoryName());
            m.put("dealType", dp.getDealType());
            if (dp.getDealType() != null && "BOGO".equals(dp.getDealType().name())) {
                m.put("deal", "Mua " + dp.getBuyQuantity() + " tặng " + dp.getFreeQuantity());
            } else {
                m.put("deal", dp.getDiscountPercent() + "%");
            }
            m.put("endDate", dp.getEndDate());
            return m;
        }).toList();

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("promotionCodes", codes);
        result.put("discountPlans", plans);
        result.put("totalActive", codes.size() + plans.size());
        return result;
    }

    private List<Map<String, Object>> listCategories() {
        return categoryRepository.findAll().stream().map(c -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("categoryId", c.getId());
            m.put("categoryName", c.getCategoryName());
            return m;
        }).toList();
    }

    private Object createDiscountCampaign(JsonNode args) {
        BigDecimal discountPercent = args.hasNonNull("discountPercent")
                ? BigDecimal.valueOf(args.path("discountPercent").asDouble()) : null;
        Long categoryId = args.hasNonNull("categoryId") ? args.path("categoryId").asLong() : null;
        Long itemId = args.hasNonNull("itemId") ? args.path("itemId").asLong() : null;
        Integer buyQuantity = args.hasNonNull("buyQuantity") ? args.path("buyQuantity").asInt() : null;
        Integer freeQuantity = args.hasNonNull("freeQuantity") ? args.path("freeQuantity").asInt() : null;
        Integer durationDays = args.hasNonNull("durationDays") ? args.path("durationDays").asInt() : null;
        return aiActionService.createDiscountCampaign(
                args.path("planName").asText(null),
                args.path("planType").asText("CATEGORY"),
                categoryId, itemId,
                args.path("dealType").asText("PERCENTAGE"),
                discountPercent, buyQuantity, freeQuantity, durationDays);
    }

    private Object createPromoCode(JsonNode args) {
        BigDecimal discountPercent = args.hasNonNull("discountPercent")
                ? BigDecimal.valueOf(args.path("discountPercent").asDouble()) : null;
        BigDecimal minOrder = args.hasNonNull("minOrder")
                ? BigDecimal.valueOf(args.path("minOrder").asDouble()) : null;
        Integer durationDays = args.hasNonNull("durationDays") ? args.path("durationDays").asInt() : null;
        return aiActionService.createPromoCode(
                args.path("name").asText(null),
                args.path("code").asText(null),
                discountPercent, minOrder, durationDays);
    }

    private List<Map<String, Object>> searchCustomers(String query) {
        if (query.isBlank()) {
            return List.of(Map.of("error", "Cần nhập tên hoặc số điện thoại khách hàng."));
        }
        return customerRepository.findByFullNameContainingIgnoreCaseOrPhoneContaining(query, query)
                .stream().limit(5).map(c -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("fullName", c.getFullName());
                    m.put("phone", c.getPhone());
                    m.put("loyaltyPoints", c.getLoyaltyPoints());
                    m.put("tier", c.getTier());
                    return m;
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
