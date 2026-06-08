package com.smartmart.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Builder
public class ItemLotResponse {
    private Long id;
    private Long itemId;
    private String itemName;
    private String lotNumber;
    private LocalDate expiryDate;
    private LocalDateTime createdAt;
}
