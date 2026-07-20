package com.smartmart.dto.response;

import com.smartmart.enums.StocktakeStatus;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@Builder
public class StocktakeResponse {
    private Long id;
    private Long locationId;
    private String locationName;
    private Long createdBy;
    private String createdByUsername;
    private LocalDateTime stocktakeDate;
    private StocktakeStatus status;
    private String note;
    private Long submittedBy;
    private String submittedByUsername;
    private LocalDateTime submittedAt;
    private Long approvedBy;
    private String approvedByUsername;
    private LocalDateTime confirmedAt;
    private List<StocktakeItemResponse> items;
}
