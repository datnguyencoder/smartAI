package com.smartmart.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
public class CreateQuotationRequest {
    private String customerName;
    private String customerPhone;
    private LocalDate validUntil;
    private String note;

    @NotEmpty
    @Valid
    private List<QuotationLineRequest> items;
}
