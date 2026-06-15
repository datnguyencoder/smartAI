package com.smartmart.dto.request;

import jakarta.validation.Valid;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class ConfirmStocktakeRequest {
    @Valid
    private List<StocktakeLineRequest> items;
}
