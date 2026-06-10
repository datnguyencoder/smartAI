package com.smartmart.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Builder
public class PromotionRecommendationResponse {

    private Long id;
    private Long itemId;
    private String itemCode;
    private String itemName;
    private BigDecimal discountPercent;
    private String reason;
    private String status;
    private String promotionCode;
    private LocalDateTime createdAt;
}
