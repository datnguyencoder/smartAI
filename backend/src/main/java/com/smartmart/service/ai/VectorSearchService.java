package com.smartmart.service.ai;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Lớp RAG: ingest chunk văn bản (đã embed) vào {@code knowledge_chunks} và truy vấn
 * top-K theo cosine similarity qua pgvector. Dùng JdbcTemplate + native SQL thay vì
 * map cột "vector" qua JPA để tránh phụ thuộc thêm Hibernate UserType.
 */
@Service
public class VectorSearchService {

    private static final Logger log = LoggerFactory.getLogger(VectorSearchService.class);

    private final JdbcTemplate jdbcTemplate;
    private final GeminiEmbeddingService embeddingService;

    public VectorSearchService(JdbcTemplate jdbcTemplate, GeminiEmbeddingService embeddingService) {
        this.jdbcTemplate = jdbcTemplate;
        this.embeddingService = embeddingService;
    }

    public boolean isAvailable() {
        return embeddingService.isConfigured();
    }

    @Transactional
    public int ingest(String sourceType, String sourceRef, List<String> chunks) {
        if (!isAvailable()) {
            log.warn("RAG ingest skipped: Gemini embedding chưa cấu hình (GEMINI_API_KEY trống)");
            return 0;
        }
        int saved = 0;
        for (int i = 0; i < chunks.size(); i++) {
            String content = chunks.get(i);
            float[] vector = embeddingService.embed(content);
            if (vector == null) {
                log.warn("Bỏ qua chunk #{} của {}/{} do embed lỗi", i, sourceType, sourceRef);
                continue;
            }
            jdbcTemplate.update("""
                    INSERT INTO knowledge_chunks (source_type, source_ref, chunk_index, content, embedding)
                    VALUES (?, ?, ?, ?, ?::vector)
                    ON CONFLICT (source_type, source_ref, chunk_index)
                    DO UPDATE SET content = excluded.content, embedding = excluded.embedding
                    """,
                    sourceType, sourceRef, i, content, GeminiEmbeddingService.toPgVectorLiteral(vector));
            saved++;
        }
        return saved;
    }

    /** Truy vấn top-K chunk gần nhất với {@code query} theo cosine similarity. Trả về rỗng nếu RAG chưa sẵn sàng. */
    public List<RetrievedChunk> search(String query, int topK) {
        if (!isAvailable()) {
            return List.of();
        }
        float[] queryVector = embeddingService.embed(query);
        if (queryVector == null) {
            return List.of();
        }
        String literal = GeminiEmbeddingService.toPgVectorLiteral(queryVector);
        return jdbcTemplate.query("""
                SELECT content, source_ref, 1 - (embedding <=> ?::vector) AS score
                FROM knowledge_chunks
                ORDER BY embedding <=> ?::vector
                LIMIT ?
                """,
                (rs, rowNum) -> new RetrievedChunk(rs.getString("content"), rs.getString("source_ref"), rs.getDouble("score")),
                literal, literal, topK);
    }

    public void clearSource(String sourceType, String sourceRef) {
        jdbcTemplate.update("DELETE FROM knowledge_chunks WHERE source_type = ? AND source_ref = ?", sourceType, sourceRef);
    }

    public long count() {
        Long total = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM knowledge_chunks", Long.class);
        return total != null ? total : 0;
    }
}
