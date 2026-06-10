package com.smartmart.service.ai.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.smartmart.service.ai.AiTextSanitizer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.time.Duration;

@Service
public class CerebrasInsightServiceImpl implements com.smartmart.service.ai.CerebrasInsightService {

    private static final Logger log = LoggerFactory.getLogger(CerebrasInsightServiceImpl.class);
    private final WebClient webClient;
    private final ObjectMapper objectMapper;
    private final String apiKey;
    private final String model;

    public CerebrasInsightServiceImpl(
            WebClient.Builder webClientBuilder,
            ObjectMapper objectMapper,
            @Value("${app.cerebras.api-key:}") String apiKey,
            @Value("${app.cerebras.base-url:https://api.cerebras.ai/v1}") String baseUrl,
            @Value("${app.cerebras.model:gpt-oss-120b}") String model
    ) {
        this.webClient = webClientBuilder.baseUrl(baseUrl).build();
        this.objectMapper = objectMapper;
        this.apiKey = apiKey;
        this.model = model;
    }

    @Override
    public String chat(String message) {
        if (apiKey == null || apiKey.isBlank()) {
            return "Trợ lý Cerebras chưa cấu hình API key. Câu hỏi: " + message;
        }
        try {
            ObjectNode body = objectMapper.createObjectNode();
            body.put("model", model);
            body.put("max_tokens", 512);
            body.put("temperature", 0.3);
            ArrayNode messages = body.putArray("messages");
            ObjectNode system = messages.addObject();
            system.put("role", "system");
            system.put("content", "Bạn là trợ lý vận hành siêu thị SmartMart.\n" + AiTextSanitizer.STYLE_RULES);
            ObjectNode user = messages.addObject();
            user.put("role", "user");
            user.put("content", message);

            JsonNode response = webClient.post()
                    .uri("/chat/completions")
                    .header("Authorization", "Bearer " + apiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(JsonNode.class)
                    .block(Duration.ofSeconds(30));

            if (response == null) {
                return "Cerebras không phản hồi.";
            }
            JsonNode choices = response.path("choices");
            if (choices.isArray() && !choices.isEmpty()) {
                String text = AiTextSanitizer.sanitize(
                        choices.get(0).path("message").path("content").asText("")
                );
                if (!text.isBlank()) {
                    return text;
                }
            }
            return "Cerebras không trả về nội dung hợp lệ.";
        } catch (WebClientResponseException ex) {
            log.warn("Cerebras call failed: {} {}", ex.getStatusCode(), ex.getResponseBodyAsString());
            if (ex.getStatusCode().value() == 404) {
                return "Model Cerebras '" + model + "' không tồn tại hoặc đã ngừng hỗ trợ. Kiểm tra CEREBRAS_MODEL.";
            }
            if (ex.getStatusCode().value() == 401 || ex.getStatusCode().value() == 403) {
                return "Cerebras API key không hợp lệ.";
            }
            if (ex.getStatusCode().value() == 429) {
                return "Cerebras tạm thời quá tải (rate limit). Vui lòng thử lại sau.";
            }
            return "Cerebras lỗi " + ex.getStatusCode().value() + ". Vui lòng thử lại sau.";
        } catch (Exception ex) {
            log.warn("Cerebras call failed: {}", ex.getMessage());
            return "Không thể kết nối Cerebras lúc này. Vui lòng thử lại sau.";
        }
    }
}
