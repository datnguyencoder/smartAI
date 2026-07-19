package com.smartmart.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class MoveCategoryItemsRequest {
    private Long targetCategoryId;
    private Boolean deleteSourceAfterMove;
    @Valid
    private List<ItemMove> moves;

    @Getter
    @Setter
    public static class ItemMove {
        @NotNull
        private Long itemId;
        @NotNull
        private Long targetCategoryId;
    }
}
