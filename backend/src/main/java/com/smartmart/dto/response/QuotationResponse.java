package com.smartmart.dto.response;

import com.smartmart.enums.QuotationStatus;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class QuotationResponse {
    private Long id;
    private String quoteCode;
    private String customerName;
    private String customerPhone;
    private QuotationStatus status;
    private BigDecimal subtotalAmount;
    private LocalDate validUntil;
    private String note;
    private Long convertedOrderId;
    private LocalDateTime createdAt;
    private List<QuotationItemResponse> items;
}
