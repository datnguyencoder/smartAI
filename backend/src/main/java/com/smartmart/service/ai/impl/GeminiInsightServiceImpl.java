package com.smartmart.service.ai.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;
import java.util.Map;

@Service
public class GeminiInsightServiceImpl implements com.smartmart.service.ai.GeminiInsightService {

    private static final Logger log = LoggerFactory.getLogger(GeminiInsightServiceImpl.class);
    private static final String GEMINI_URL =
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

    private final WebClient webClient;
    private final ObjectMapper objectMapper;
    private final String apiKey;

    public GeminiInsightServiceImpl(
            WebClient.Builder webClientBuilder,
            ObjectMapper objectMapper,
            @Value("${app.gemini.api-key:}") String apiKey
    ) {
        this.webClient = webClientBuilder.build();
        this.objectMapper = objectMapper;
        this.apiKey = apiKey;
    }

    @Override
    public String explainRisk(Map<String, Object> payload) {
        if (apiKey == null || apiKey.isBlank()) {
            return "## Phân tích rủi ro (offline)\n\nGemini API chưa cấu hình. Dữ liệu: " + payload;
        }
        String systemPrompt = """
                Bạn là Trợ lý phân tích chuỗi cung ứng của SmartMart AI.
                Phân tích ngắn gọn bằng tiếng Việt (Markdown), không bịa số liệu, tập trung hành động nhập hàng/khuyến mãi.
                """;
        String userPrompt = "Phân tích rủi ro tồn kho với dữ liệu JSON sau:\n" + payload;
        return callGemini(systemPrompt, userPrompt);
    }

    @Override
    public String chat(String message) {
        if (apiKey == null || apiKey.isBlank()) {
            return "Trợ lý AI chưa kết nối Gemini. Câu hỏi của bạn: " + message;
        }
        String systemPrompt = "Bạn là trợ lý vận hành siêu thị SmartMart. Trả lời ngắn gọn bằng tiếng Việt, dùng Markdown khi cần.";
        return callGemini(systemPrompt, message);
    }

    private String callGemini(String systemPrompt, String userPrompt) {
        try {
            ObjectNode body = objectMapper.createObjectNode();
            ArrayNode contents = body.putArray("contents");
            ObjectNode userContent = contents.addObject();
            userContent.put("role", "user");
            ArrayNode parts = userContent.putArray("parts");
            parts.addObject().put("text", systemPrompt + "\n\n" + userPrompt);

            JsonNode response = webClient.post()
                    .uri(GEMINI_URL + "?key=" + apiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(JsonNode.class)
                    .block(Duration.ofSeconds(30));

            if (response == null) {
                return "Gemini không phản hồi.";
            }
            JsonNode candidates = response.path("candidates");
            if (candidates.isArray() && !candidates.isEmpty()) {
                String text = candidates.get(0).path("content").path("parts").path(0).path("text").asText("");
                if (!text.isBlank()) {
                    return text;
                }
            }
            return "Gemini không trả về nội dung hợp lệ.";
        } catch (Exception ex) {
            log.warn("Gemini call failed: {}", ex.getMessage());
            return "Không thể kết nối Gemini lúc này. Vui lòng thử lại sau.";
        }
    }
}
