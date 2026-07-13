package com.smartmart.service.ai;

public interface GeminiAgentService {
    boolean isAvailable();

    /** Chat có function-calling: Gemini có thể tự gọi tool để lấy dữ liệu vận hành/chính sách thật trước khi trả lời. */
    String chat(String message);
}
