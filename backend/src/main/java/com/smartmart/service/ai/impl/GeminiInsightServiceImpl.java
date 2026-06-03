package com.smartmart.service.ai.impl;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class GeminiInsightServiceImpl implements com.smartmart.service.ai.GeminiInsightService {

    @Value("${app.gemini.api-key:}")
    private String apiKey;

    @Override
    public String explainRisk(Map<String, Object> payload) {
        if (apiKey == null || apiKey.isBlank()) {
            return "## Phân tích rủi ro (offline)\n\nGemini API chưa cấu hình. Dữ liệu: " + payload;
        }
        return "## Phân tích rủi ro\n\n(Tích hợp Gemini đầy đủ khi có `GEMINI_API_KEY`)\n\n" + payload;
    }

    @Override
    public String chat(String message) {
        if (apiKey == null || apiKey.isBlank()) {
            return "Trợ lý AI chưa kết nối Gemini. Câu hỏi của bạn: " + message;
        }
        return "Phản hồi Gemini cho: " + message;
    }
}
