package com.smartmart.service.ai.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.smartmart.service.AuditLogService;
import com.smartmart.service.ai.AiTextSanitizer;
import com.smartmart.service.ai.GeminiApiDelegate;
import com.smartmart.service.ai.GeminiContextBuilder;
import com.smartmart.service.ai.GeminiInsightService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.util.HexFormat;
import java.util.Map;

@Service
public class GeminiInsightServiceImpl implements GeminiInsightService {

    private static final Logger log = LoggerFactory.getLogger(GeminiInsightServiceImpl.class);
    private static final Duration CACHE_TTL = Duration.ofMinutes(10);

    private final GeminiApiDelegate apiDelegate;
    private final ObjectMapper objectMapper;
    private final String apiKey;
    private final String model;
    private final GeminiContextBuilder contextBuilder;
    private final AuditLogService auditLogService;
    private final RedisTemplate<String, Object> redisTemplate;

    public GeminiInsightServiceImpl(
            GeminiApiDelegate apiDelegate,
            ObjectMapper objectMapper,
            @Value("${app.gemini.api-key:}") String apiKey,
            @Value("${app.gemini.model:gemini-2.5-flash}") String model,
            GeminiContextBuilder contextBuilder,
            AuditLogService auditLogService,
            ObjectProvider<RedisTemplate<String, Object>> redisTemplateProvider
    ) {
        this.apiDelegate = apiDelegate;
        this.objectMapper = objectMapper;
        this.apiKey = apiKey;
        this.model = model;
        this.contextBuilder = contextBuilder;
        this.auditLogService = auditLogService;
        this.redisTemplate = redisTemplateProvider.getIfAvailable();
    }

    @Override
    public String explainRisk(Map<String, Object> payload) {
        String prompt = """
                Bạn là chuyên gia phân tích rủi ro tồn kho cho siêu thị SmartMart.
                Dữ liệu JSON:
                %s
                Hãy phân tích ngắn gọn: rủi ro thiếu hàng, ứ đọng, hết hạn, và khuyến nghị hành động.
                %s
                """.formatted(payload, AiTextSanitizer.STYLE_RULES);
        return generate(prompt, "gemini:explain-risk:" + hash(payload.toString()));
    }

    @Override
    public String explainForecast(Long itemId) {
        Map<String, Object> ctx = contextBuilder.buildItemContext(itemId);
        String prompt = contextBuilder.buildExplainPrompt(ctx);
        String cacheKey = "gemini:explain-forecast:" + itemId + ":" + hash(ctx.toString());
        String result = generate(prompt, cacheKey);
        auditLogService.log("AI_EXPLAIN_FORECAST", "Gemini phân tích dự báo itemId=" + itemId);
        return result;
    }

    @Override
    public String suggestPromotion(Long itemId) {
        Map<String, Object> ctx = contextBuilder.buildItemContext(itemId);
        String prompt = contextBuilder.buildPromotionPrompt(ctx);
        String cacheKey = "gemini:suggest-promo:" + itemId + ":" + hash(ctx.toString());
        String result = generate(prompt, cacheKey);
        auditLogService.log("AI_SUGGEST_PROMO", "Gemini đề xuất KM itemId=" + itemId);
        return result;
    }

    @Override
    public String chat(String message) {
        return generate(message, null);
    }

    private String generate(String prompt, String cacheKey) {
        if (apiKey == null || apiKey.isBlank()) {
            return "Gemini chưa được cấu hình API key. Nội dung yêu cầu: " + prompt;
        }

        if (cacheKey != null) {
            String cached = getCache(cacheKey);
            if (cached != null) {
                return AiTextSanitizer.sanitize(cached);
            }
        }

        try {
            ObjectNode body = objectMapper.createObjectNode();
            ArrayNode contents = body.putArray("contents");
            ObjectNode content = contents.addObject();
            ArrayNode parts = content.putArray("parts");
            parts.addObject().put("text", prompt);

            JsonNode response = apiDelegate.call(model, apiKey, body);

            if (response == null) {
                return "Gemini không phản hồi.";
            }

            JsonNode candidates = response.path("candidates");
            if (candidates.isArray() && !candidates.isEmpty()) {
                String text = AiTextSanitizer.sanitize(
                        candidates.get(0).path("content").path("parts").path(0).path("text").asText("")
                );
                if (!text.isBlank()) {
                    if (cacheKey != null) {
                        putCache(cacheKey, text);
                    }
                    return text;
                }
            }
            return "Gemini không trả về nội dung hợp lệ.";
        } catch (WebClientResponseException ex) {
            log.warn("Gemini call failed: {} {}", ex.getStatusCode(), ex.getResponseBodyAsString());
            if (ex.getStatusCode().value() == 429) {
                return "Gemini tạm thời quá tải (rate limit). Vui lòng thử lại sau 1–2 phút.";
            }
            if (ex.getStatusCode().value() == 401 || ex.getStatusCode().value() == 403) {
                return "Gemini API key không hợp lệ hoặc chưa được cấp quyền.";
            }
            return "Gemini lỗi " + ex.getStatusCode().value() + ". Vui lòng thử lại sau.";
        } catch (Exception ex) {
            log.warn("Gemini call failed: {}", ex.getMessage());
            return "Không thể kết nối Gemini lúc này. Vui lòng thử lại sau.";
        }
    }

    private String getCache(String key) {
        if (redisTemplate == null) {
            return null;
        }
        try {
            Object val = redisTemplate.opsForValue().get(key);
            return val != null ? val.toString() : null;
        } catch (Exception ex) {
            log.debug("Redis cache miss/error: {}", ex.getMessage());
            return null;
        }
    }

    private void putCache(String key, String value) {
        if (redisTemplate == null) {
            return;
        }
        try {
            redisTemplate.opsForValue().set(key, value, CACHE_TTL);
        } catch (Exception ex) {
            log.debug("Redis cache write failed: {}", ex.getMessage());
        }
    }

    private String hash(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] bytes = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(bytes).substring(0, 16);
        } catch (Exception ex) {
            return String.valueOf(input.hashCode());
        }
    }
}
