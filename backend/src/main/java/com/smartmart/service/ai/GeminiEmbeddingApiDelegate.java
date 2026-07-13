package com.smartmart.service.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Recover;
import org.springframework.retry.annotation.Retryable;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientRequestException;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.io.IOException;
import java.time.Duration;

/**
 * Tách riêng khỏi {@link GeminiApiDelegate} để tránh 2 method @Retryable/@Recover
 * cùng chữ ký (String, String, ObjectNode) -> JsonNode trong 1 class, gây nhập nhằng
 * khi Spring Retry chọn @Recover method tương ứng.
 */
@Component
public class GeminiEmbeddingApiDelegate {

    private static final Logger log = LoggerFactory.getLogger(GeminiEmbeddingApiDelegate.class);
    private static final String GEMINI_EMBED_URL_TEMPLATE =
            "https://generativelanguage.googleapis.com/v1beta/models/%s:embedContent";

    private final WebClient webClient;

    public GeminiEmbeddingApiDelegate(WebClient.Builder webClientBuilder) {
        this.webClient = webClientBuilder.build();
    }

    @Retryable(
            retryFor = {WebClientRequestException.class, IOException.class},
            noRetryFor = {WebClientResponseException.class},
            maxAttempts = 3,
            backoff = @Backoff(delay = 1000, multiplier = 2)
    )
    public JsonNode embed(String embeddingModel, String apiKey, ObjectNode requestBody) {
        return webClient.post()
                .uri(GEMINI_EMBED_URL_TEMPLATE.formatted(embeddingModel))
                .header("x-goog-api-key", apiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(JsonNode.class)
                .block(Duration.ofSeconds(30));
    }

    @Recover
    public JsonNode recoverEmbed(Exception ex, String embeddingModel, String apiKey, ObjectNode requestBody) {
        log.warn("Gemini embedding call failed after retries (model={}): {}", embeddingModel, ex.getMessage());
        return null;
    }
}
