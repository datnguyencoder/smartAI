package com.smartmart.service.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * Gọi Gemini embedContent API (models/text-embedding-004) để sinh vector 768 chiều
 * dùng cho RAG (knowledge_chunks.embedding). Đây là gateway duy nhất tạo embedding
 * trong hệ thống — cả pipeline ingest tài liệu lẫn truy vấn RAG đều đi qua đây để
 * đảm bảo cùng model/không gian vector.
 */
@Service
public class GeminiEmbeddingService {

    private static final Logger log = LoggerFactory.getLogger(GeminiEmbeddingService.class);
    public static final int EMBEDDING_DIMENSION = 768;

    private final GeminiEmbeddingApiDelegate apiDelegate;
    private final ObjectMapper objectMapper;
    private final String apiKey;
    private final String embeddingModel;

    public GeminiEmbeddingService(
            GeminiEmbeddingApiDelegate apiDelegate,
            ObjectMapper objectMapper,
            @Value("${app.gemini.api-key:}") String apiKey,
            @Value("${app.gemini.embedding-model:gemini-embedding-001}") String embeddingModel) {
        this.apiDelegate = apiDelegate;
        this.objectMapper = objectMapper;
        this.apiKey = apiKey;
        this.embeddingModel = embeddingModel;
    }

    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank();
    }

    /**
     * Trả về vector embedding của {@code text}, hoặc null nếu Gemini chưa cấu hình
     * hoặc API lỗi (RAG sẽ tự vô hiệu hóa mà không làm sập luồng gọi — SYS-10 AI isolation).
     */
    public float[] embed(String text) {
        if (!isConfigured()) {
            return null;
        }
        try {
            ObjectNode body = objectMapper.createObjectNode();
            body.put("model", "models/" + embeddingModel);
            ObjectNode content = body.putObject("content");
            ArrayNode parts = content.putArray("parts");
            parts.addObject().put("text", text);
            // Model gốc trả 3072 chiều — ép về EMBEDDING_DIMENSION để khớp cột pgvector(768).
            // Cosine distance (<=>) không phụ thuộc độ dài vector nên không cần tự chuẩn hóa lại.
            body.put("outputDimensionality", EMBEDDING_DIMENSION);

            JsonNode response = apiDelegate.embed(embeddingModel, apiKey, body);
            if (response == null) {
                return null;
            }
            JsonNode values = response.path("embedding").path("values");
            if (!values.isArray() || values.isEmpty()) {
                return null;
            }
            float[] vector = new float[values.size()];
            for (int i = 0; i < values.size(); i++) {
                vector[i] = (float) values.get(i).asDouble();
            }
            return vector;
        } catch (Exception ex) {
            log.warn("Gemini embedding failed: {}", ex.getMessage());
            return null;
        }
    }

    /** Format vector thành literal pgvector '[0.1,0.2,...]' để dùng trong native SQL. */
    public static String toPgVectorLiteral(float[] vector) {
        StringBuilder sb = new StringBuilder(vector.length * 8);
        sb.append('[');
        for (int i = 0; i < vector.length; i++) {
            if (i > 0) sb.append(',');
            sb.append(vector[i]);
        }
        sb.append(']');
        return sb.toString();
    }
}
