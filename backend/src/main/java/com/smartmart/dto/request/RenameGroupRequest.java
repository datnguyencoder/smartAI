package com.smartmart.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RenameGroupRequest {
    @NotBlank(message = "Tên nhóm không được để trống")
    @Size(min = 1, max = 255, message = "Tên nhóm phải từ 1 đến 255 ký tự")
    private String name;
}
