package com.smartmart.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class CreateStocktakeRequest {
    @NotNull
    private Long locationId;
    private String note;
    @NotEmpty
    @Valid
    private List<StocktakeLineRequest> items;
}
