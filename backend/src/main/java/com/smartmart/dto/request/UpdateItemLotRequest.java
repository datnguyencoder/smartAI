package com.smartmart.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class UpdateItemLotRequest {
    @NotBlank(message = "Mã lô không được để trống")
    private String lotNumber;

    private LocalDate expiryDate;
}
