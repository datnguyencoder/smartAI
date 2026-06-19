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
 * Thin delegate that owns the raw Gemini HTTP call with retry logic.
 * Extracted as a separate bean so @Retryable AOP proxy works correctly
 * (Spring cannot intercept self-invocations).
 */
@Component
public class GeminiApiDelegate {

    private static final Logger log = LoggerFactory.getLogger(GeminiApiDelegate.class);
    private static final String GEMINI_URL_TEMPLATE =
            "https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent";

    private final WebClient webClient;

    public GeminiApiDelegate(WebClient.Builder webClientBuilder) {
        this.webClient = webClientBuilder.build();
    }

    /**
     * Calls the Gemini API. Retries up to 3 times on transient network errors.
     * Returns null if all retries are exhausted (caller handles gracefully).
     * Does NOT retry on HTTP 4xx/5xx — those are handled separately.
     */
    @Retryable(
            retryFor = {WebClientRequestException.class, IOException.class},
            noRetryFor = {WebClientResponseException.class},
            maxAttempts = 3,
            backoff = @Backoff(delay = 1000, multiplier = 2)
    )
    public JsonNode call(String model, String apiKey, ObjectNode requestBody) {
        return webClient.post()
                .uri(GEMINI_URL_TEMPLATE.formatted(model))
                .header("x-goog-api-key", apiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(JsonNode.class)
                .block(Duration.ofSeconds(45));
    }

    @Recover
    public JsonNode recoverCall(Exception ex, String model, String apiKey, ObjectNode requestBody) {
        log.warn("Gemini API call failed after retries (model={}): {}", model, ex.getMessage());
        return null;
    }
}
