package com.smartmart.dto.response;

import com.smartmart.enums.StocktakeStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class StocktakeResponse {
    private Long id;
    private Long locationId;
    private String locationName;
    private Long createdBy;
    private LocalDateTime stocktakeDate;
    private StocktakeStatus status;
    private String note;
    private LocalDateTime confirmedAt;
    private List<StocktakeItemResponse> items;
}
