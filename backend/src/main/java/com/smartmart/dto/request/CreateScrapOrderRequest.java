package com.smartmart.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class CreateScrapOrderRequest {
    @NotNull
    private Long locationId;
    @NotEmpty
    @Valid
    private List<ScrapLineRequest> items;
}
