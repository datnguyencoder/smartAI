package com.smartmart.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@Builder
public class PromotionValidateResponse {
    private boolean valid;
    private String promotionName;
    private String code;
    private BigDecimal discountAmount;
    private String message;
}
