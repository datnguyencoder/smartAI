package com.smartmart.service.ai;

/** Một chunk kiến thức lấy được từ RAG kèm điểm tương đồng cosine (0..1, càng cao càng liên quan). */
public record RetrievedChunk(String content, String sourceRef, double score) {
}
