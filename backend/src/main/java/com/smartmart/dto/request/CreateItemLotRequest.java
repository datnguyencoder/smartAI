package com.smartmart.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class CreateItemLotRequest {
    @NotNull(message = "ID Sản phẩm không được để trống")
    private Long itemId;

    @NotBlank(message = "Mã lô không được để trống")
    private String lotNumber;

    private LocalDate expiryDate;
}
