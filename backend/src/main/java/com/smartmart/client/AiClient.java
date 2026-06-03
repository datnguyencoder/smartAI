package com.smartmart.client;

import com.fasterxml.jackson.databind.JsonNode;
import com.smartmart.exception.AiServiceException;
import com.smartmart.exception.ErrorCode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.time.Duration;
import java.util.List;
import java.util.Map;

@Component
public class AiClient {

    private static final Logger log = LoggerFactory.getLogger(AiClient.class);

    private final WebClient webClient;

    public AiClient(WebClient.Builder builder, @Value("${app.ai.base-url}") String baseUrl) {
        this.webClient = builder.baseUrl(baseUrl).build();
    }

    public JsonNode train(List<Map<String, Object>> salesHistory) {
        return post("/ai/train", Map.of("sales_history", salesHistory));
    }

    public JsonNode forecastAll(List<Map<String, Object>> items) {
        return post("/ai/forecast/all", Map.of("items", items));
    }

    public JsonNode health() {
        try {
            return webClient.get()
                    .uri("/ai/health")
                    .retrieve()
                    .bodyToMono(JsonNode.class)
                    .block(Duration.ofSeconds(5));
        } catch (Exception e) {
            log.warn("AI health check failed: {}", e.getMessage());
            return null;
        }
    }

    public JsonNode metrics() {
        return get("/ai/model/metrics");
    }

    private JsonNode post(String path, Object body) {
        try {
            return webClient.post()
                    .uri(path)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(JsonNode.class)
                    .block(Duration.ofSeconds(120));
        } catch (WebClientResponseException e) {
            log.error("AI service error {}: {}", path, e.getResponseBodyAsString());
            throw new AiServiceException("AI service error: " + e.getStatusCode());
        } catch (Exception e) {
            log.error("AI service unavailable {}: {}", path, e.getMessage());
            throw new AiServiceException(ErrorCode.AI_SERVICE_UNAVAILABLE.getMessage());
        }
    }

    private JsonNode get(String path) {
        try {
            return webClient.get()
                    .uri(path)
                    .retrieve()
                    .bodyToMono(JsonNode.class)
                    .block(Duration.ofSeconds(30));
        } catch (Exception e) {
            throw new AiServiceException(ErrorCode.AI_SERVICE_UNAVAILABLE.getMessage());
        }
    }
}
