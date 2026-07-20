package com.smartmart.service.ai.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.smartmart.service.AuditLogService;
import com.smartmart.service.ai.AiTextSanitizer;
import com.smartmart.service.ai.AiToolExecutor;
import com.smartmart.service.ai.GeminiAgentService;
import com.smartmart.service.ai.GeminiApiDelegate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.util.Iterator;

/**
 * Agent chat có function-calling thật (không phải prompt-in/text-out thuần):
 * Gemini có thể tự quyết định gọi 1 hoặc nhiều tool trong {@link AiToolExecutor} để lấy
 * dữ liệu tồn kho/forecast/chính sách hiện hành trước khi trả lời, thay vì chỉ suy diễn
 * từ prompt tĩnh. Vòng lặp tool-call bị giới hạn số bước để tránh runaway cost/loop.
 */
@Service
public class GeminiAgentServiceImpl implements GeminiAgentService {

    private static final Logger log = LoggerFactory.getLogger(GeminiAgentServiceImpl.class);
    private static final int MAX_TOOL_ROUNDS = 6;
    // gemini-2.5-flash bật thinking mặc định; giới hạn budget để agent loop không bị timeout.
    private static final int THINKING_BUDGET = 1024;

    private static final String SYSTEM_INSTRUCTION = """
            Bạn là trợ lý AI vận hành của siêu thị mini SmartMart — hệ thống quản lý bán lẻ
            tích hợp POS, kho, tài chính và AI dự báo.

            ## Nguyên tắc bắt buộc
            - LUÔN gọi tool để lấy dữ liệu thật trước khi trả lời bất kỳ câu hỏi nào về số liệu.
            - KHÔNG tự bịa số liệu, tên sản phẩm, mã khuyến mãi hay doanh thu.
            - Nếu tool trả về rỗng/lỗi, thông báo rõ và đề nghị người dùng kiểm tra lại.

            ## Tool ĐỌC dữ liệu (read-only)
            - **search_item**: khi người dùng hỏi về sản phẩm cụ thể theo tên/SKU → lấy itemId
            - **get_item_detail**: sau search_item để lấy tồn kho, giá, dự báo, HSD chi tiết
            - **get_low_stock_alerts**: câu hỏi về "hết hàng", "tồn thấp", "cảnh báo kho"
            - **get_expiring_lots**: câu hỏi về "sắp hết hạn", "cận date", "lô hàng HSD"
            - **get_dashboard_summary**: "hôm nay bán được bao nhiêu", "tổng quan cửa hàng"
            - **get_revenue_trend**: "doanh thu tuần này", "xu hướng 7 ngày", "ngày nào bán tốt"
            - **get_top_selling_items**: "sản phẩm bán chạy nhất", "top SKU", "hàng hot"
            - **get_reorder_recommendations**: "cần nhập gì", "gợi ý đặt hàng", "hàng sắp hết"
            - **get_active_promotions**: "khuyến mãi đang chạy", "mã giảm giá", "kế hoạch KM"
            - **list_categories**: lấy id + tên danh mục (gọi trước khi tạo KM theo danh mục)
            - **search_customers**: "tìm khách hàng", "điểm tích lũy", "hạng thẻ khách"
            - **search_store_policy**: "chính sách đổi trả", "quy định", "phân quyền", "quy trình"

            ## Tool HÀNH ĐỘNG - tạo mới dữ liệu (WRITE, dùng cẩn thận)
            - **create_discount_campaign**: TẠO chiến dịch giảm giá tự động (giảm %, hoặc mua X tặng Y)
              theo danh mục hoặc theo sản phẩm. Dùng khi người dùng nói "lên chiến dịch KM",
              "tạo khuyến mãi mua 1 tặng 1", "giảm 20% danh mục đồ uống", "xả hàng cận date".
            - **create_promo_code**: TẠO mã giảm giá (coupon) khách nhập tại POS.

            ## Quy tắc khi HÀNH ĐỘNG (tạo mới)
            1. Chỉ tạo khi ý định người dùng RÕ RÀNG và đủ tham số (đối tượng, loại ưu đãi, mức giảm).
               Nếu thiếu/mơ hồ → HỎI LẠI, tuyệt đối không đoán.
            2. Với KM theo danh mục: gọi list_categories để lấy đúng categoryId.
               Với KM theo sản phẩm: gọi search_item để lấy đúng itemId.
            3. Với "xả hàng cận date": gọi get_expiring_lots trước, rồi tạo chiến dịch theo SKU cho
               lô cận hạn, gợi ý % giảm sâu hơn nếu càng gần hết hạn (≤3 ngày ~50%, ≤7 ngày ~30%).
            4. Sau khi tạo THÀNH CÔNG: báo lại rõ ràng đã tạo gì (tên, đối tượng, mức ưu đãi, hiệu lực đến ngày nào)
               và nhắc người dùng có thể tắt chiến dịch trong trang Khuyến mãi nếu cần.

            ## Định dạng trả lời
            - Dùng Markdown (## tiêu đề, - danh sách, **in đậm** cho số liệu quan trọng)
            - Ngắn gọn, tập trung vào dữ liệu thực tế từ tool
            - Kết thúc bằng 1–3 đề xuất hành động cụ thể nếu có
            """ + AiTextSanitizer.STYLE_RULES;

    private final GeminiApiDelegate apiDelegate;
    private final AiToolExecutor toolExecutor;
    private final ObjectMapper objectMapper;
    private final AuditLogService auditLogService;
    private final String apiKey;
    private final String model;

    public GeminiAgentServiceImpl(
            GeminiApiDelegate apiDelegate,
            AiToolExecutor toolExecutor,
            ObjectMapper objectMapper,
            AuditLogService auditLogService,
            @Value("${app.gemini.api-key:}") String apiKey,
            @Value("${app.gemini.model:gemini-2.5-flash}") String model) {
        this.apiDelegate = apiDelegate;
        this.toolExecutor = toolExecutor;
        this.objectMapper = objectMapper;
        this.auditLogService = auditLogService;
        this.apiKey = apiKey;
        this.model = model;
    }

    @Override
    public boolean isAvailable() {
        return apiKey != null && !apiKey.isBlank();
    }

    @Override
    public String chat(String message) {
        if (!isAvailable()) {
            return null;
        }

        ArrayNode contents = objectMapper.createArrayNode();
        contents.addObject().put("role", "user").putArray("parts").addObject().put("text", message);

        ArrayNode tools = toolExecutor.buildToolDeclarations();
        StringBuilder toolsUsed = new StringBuilder();

        try {
            for (int round = 0; round < MAX_TOOL_ROUNDS; round++) {
                ObjectNode body = objectMapper.createObjectNode();
                body.set("contents", contents);
                body.set("tools", tools);
                ObjectNode systemInstruction = body.putObject("systemInstruction");
                systemInstruction.putArray("parts").addObject().put("text", SYSTEM_INSTRUCTION);
                body.putObject("generationConfig")
                        .putObject("thinkingConfig")
                        .put("thinkingBudget", THINKING_BUDGET);

                JsonNode response = apiDelegate.call(model, apiKey, body);
                if (response == null) {
                    return null;
                }

                JsonNode candidateContent = response.path("candidates").get(0).path("content");
                JsonNode parts = candidateContent.path("parts");

                JsonNode functionCallPart = findFunctionCall(parts);
                if (functionCallPart == null) {
                    String text = extractText(parts);
                    if (toolsUsed.length() > 0) {
                        auditLogService.log("AI_AGENT_CHAT", "AI_INSIGHT", "chat",
                                "AI agent trả lời sau khi dùng tool: " + toolsUsed, null, null);
                    }
                    return AiTextSanitizer.sanitize(text);
                }

                String toolName = functionCallPart.path("functionCall").path("name").asText();
                JsonNode args = functionCallPart.path("functionCall").path("args");
                Object result = toolExecutor.dispatch(toolName, args);
                toolsUsed.append(toolName).append(' ');

                // Lưu lại lượt "model" đã yêu cầu gọi tool, rồi thêm lượt "function" trả kết quả
                contents.addObject().put("role", "model").set("parts", singlePartArray(functionCallPart));

                ObjectNode functionResponsePart = objectMapper.createObjectNode();
                ObjectNode functionResponse = functionResponsePart.putObject("functionResponse");
                functionResponse.put("name", toolName);
                // Gemini yêu cầu "response" luôn là object (Struct) — bọc lại nếu tool trả về mảng/list,
                // nếu không API trả 400 "Proto field is not repeating, cannot start list".
                JsonNode resultNode = objectMapper.valueToTree(result);
                if (!resultNode.isObject()) {
                    ObjectNode wrapper = objectMapper.createObjectNode();
                    wrapper.set("result", resultNode);
                    resultNode = wrapper;
                }
                functionResponse.set("response", resultNode);
                // Gemini v1beta yêu cầu functionResponse nằm trong role "user", không phải "function".
                contents.addObject().put("role", "user").set("parts", singlePartArray(functionResponsePart));
            }
            log.warn("AI agent vượt quá {} vòng gọi tool, dừng lại", MAX_TOOL_ROUNDS);
            return "Xin lỗi, câu hỏi này cần tra cứu quá nhiều bước. Bạn có thể hỏi cụ thể hơn không?";
        } catch (WebClientResponseException ex) {
            log.warn("Gemini agent chat lỗi HTTP {}: {}", ex.getStatusCode(), ex.getMessage());
            return null;
        } catch (Exception ex) {
            log.warn("Gemini agent chat lỗi: {}", ex.getMessage());
            return null;
        }
    }

    private JsonNode findFunctionCall(JsonNode parts) {
        if (!parts.isArray()) return null;
        Iterator<JsonNode> it = parts.elements();
        while (it.hasNext()) {
            JsonNode part = it.next();
            if (part.has("functionCall")) {
                return part;
            }
        }
        return null;
    }

    private String extractText(JsonNode parts) {
        if (!parts.isArray()) return "";
        StringBuilder sb = new StringBuilder();
        for (JsonNode part : parts) {
            if (part.has("text")) {
                sb.append(part.path("text").asText());
            }
        }
        return sb.toString();
    }

    private ArrayNode singlePartArray(JsonNode part) {
        ArrayNode arr = objectMapper.createArrayNode();
        arr.add(part);
        return arr;
    }
}
