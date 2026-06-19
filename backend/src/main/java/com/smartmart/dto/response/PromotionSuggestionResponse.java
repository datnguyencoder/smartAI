package com.smartmart.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@Builder
public class PromotionSuggestionResponse {
    private Long promotionId;
    private String suggestion;
    private BigDecimal discountPercent;
    private String status;
    /** GEMINI khi Gemini trả lời thành công, FALLBACK khi Gemini lỗi */
    private String source;
}
