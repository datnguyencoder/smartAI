package com.smartmart.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@Builder
public class BestSellerCategoryResponse {
    private Long categoryId;
    private String categoryName;
    private BigDecimal quantitySold;
    private BigDecimal revenue;
}
