package com.smartmart.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class OrderPrintResponse {
    private Long id;
    private String orderCode;
    private String customerName;
    private String customerPhone;
    private LocalDateTime orderDate;
    private String staffName;
    private BigDecimal subtotalAmount;
    private BigDecimal discountAmount;
    private BigDecimal vatAmount;
    private BigDecimal totalAmount;
    private String paymentMethod;
    private String promotionCode;
    private Integer loyaltyPointsRedeemed;
    private Integer loyaltyPointsEarned;
    private List<PrintLine> items;

    @Getter
    @Builder
    public static class PrintLine {
        private String itemCode;
        private String itemName;
        private BigDecimal quantity;
        private BigDecimal unitPrice;
        private BigDecimal lineTotal;
    }
}
