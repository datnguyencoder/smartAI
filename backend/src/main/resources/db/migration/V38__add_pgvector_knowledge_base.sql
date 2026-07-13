-- RAG: pgvector extension + bảng lưu chunk kiến thức (business rule, chính sách) đã embed.
CREATE EXTENSION IF NOT EXISTS vector;

-- Gemini text-embedding-004 sinh vector 768 chiều.
CREATE TABLE knowledge_chunks (
    id BIGSERIAL PRIMARY KEY,
    source_type VARCHAR(50) NOT NULL,
    source_ref VARCHAR(255) NOT NULL,
    chunk_index INT NOT NULL,
    content TEXT NOT NULL,
    embedding vector(768) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    UNIQUE (source_type, source_ref, chunk_index)
);

-- ANN index cosine similarity; với dataset nhỏ (demo/thesis) sequential scan vẫn đủ nhanh,
-- index này thể hiện đúng thực hành khi dữ liệu lớn dần.
CREATE INDEX idx_knowledge_chunks_embedding
    ON knowledge_chunks
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);
