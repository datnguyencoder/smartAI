package com.smartmart.service.ai;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Nạp tài liệu nghiệp vụ (business rule, chính sách) đóng gói sẵn trong resources/knowledge
 * vào knowledge_chunks để AI chat có thể RAG khi trả lời câu hỏi về chính sách cửa hàng.
 * Chạy thủ công qua endpoint admin (không auto-run mỗi lần start để tránh tốn quota embedding).
 */
@Service
public class KnowledgeBaseIngestionService {

    private static final Logger log = LoggerFactory.getLogger(KnowledgeBaseIngestionService.class);
    private static final String SOURCE_TYPE = "STORE_POLICY";
    private static final int MAX_CHUNK_CHARS = 900;

    private static final Map<String, String> KNOWLEDGE_FILES = Map.of(
            "business-rules.md", "knowledge/business-rules.md",
            "privacy-policy.md", "knowledge/privacy-policy.md"
    );

    private final VectorSearchService vectorSearchService;

    public KnowledgeBaseIngestionService(VectorSearchService vectorSearchService) {
        this.vectorSearchService = vectorSearchService;
    }

    /** Xóa dữ liệu cũ và nạp lại toàn bộ tài liệu. Trả về map tên file -> số chunk đã lưu. */
    public Map<String, Integer> reindexAll() {
        Map<String, Integer> result = new LinkedHashMap<>();
        for (Map.Entry<String, String> entry : KNOWLEDGE_FILES.entrySet()) {
            String sourceRef = entry.getKey();
            String classpathLocation = entry.getValue();
            try {
                String content = readClasspathFile(classpathLocation);
                List<String> chunks = chunkMarkdown(content);
                vectorSearchService.clearSource(SOURCE_TYPE, sourceRef);
                int saved = vectorSearchService.ingest(SOURCE_TYPE, sourceRef, chunks);
                result.put(sourceRef, saved);
                log.info("RAG reindex {}: {} chunk đã lưu", sourceRef, saved);
            } catch (Exception ex) {
                log.error("RAG reindex thất bại cho {}: {}", sourceRef, ex.getMessage());
                result.put(sourceRef, -1);
            }
        }
        return result;
    }

    private String readClasspathFile(String location) throws IOException {
        try (InputStream in = new ClassPathResource(location).getInputStream()) {
            return new String(in.readAllBytes(), StandardCharsets.UTF_8);
        }
    }

    /**
     * Chunk markdown theo heading: mỗi chunk giữ heading gần nhất làm ngữ cảnh,
     * cắt bớt nếu một section quá dài để tránh vượt giới hạn embedding.
     */
    static List<String> chunkMarkdown(String content) {
        List<String> chunks = new ArrayList<>();
        String currentHeading = "";
        StringBuilder buffer = new StringBuilder();

        for (String line : content.split("\n")) {
            boolean isHeading = line.startsWith("#");
            if (isHeading) {
                flushIfNotBlank(chunks, currentHeading, buffer);
                currentHeading = line.replaceFirst("^#+\\s*", "").trim();
                buffer.setLength(0);
                continue;
            }
            if (buffer.length() + line.length() + 1 > MAX_CHUNK_CHARS) {
                flushIfNotBlank(chunks, currentHeading, buffer);
                buffer.setLength(0);
            }
            buffer.append(line).append('\n');
        }
        flushIfNotBlank(chunks, currentHeading, buffer);
        return chunks;
    }

    private static void flushIfNotBlank(List<String> chunks, String heading, StringBuilder buffer) {
        String body = buffer.toString().trim();
        if (body.isEmpty()) {
            return;
        }
        chunks.add(heading.isBlank() ? body : heading + "\n" + body);
    }
}
