package com.smartmart.dto.request;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
public class UpdatePromotionRequest {
    private String name;
    private String code;
    private String type;
    private BigDecimal value;
    private BigDecimal minOrder;
    private LocalDate startDate;
    private LocalDate endDate;
    private Boolean active;
}
