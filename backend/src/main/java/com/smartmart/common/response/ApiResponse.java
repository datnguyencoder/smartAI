package com.smartmart.common.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

import java.time.LocalDateTime;
import java.util.Map;

// Envelope REST chuẩn: success + data, hoặc errorCode (+ errors khi validation)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
@Schema(description = "Cấu trúc phản hồi chuẩn của toàn bộ API")
public class ApiResponse<T> {

    @Schema(description = "Trạng thái xử lý", example = "true")
    private boolean success;

    @Schema(description = "Thông điệp cho người dùng", example = "Thành công")
    private String message;

    @Schema(description = "Mã lỗi máy đọc được (chỉ khi success=false)", example = "VALIDATION_FAILED")
    private String errorCode;

    @Schema(description = "Dữ liệu trả về (chỉ khi success=true)")
    private T data;

    @Schema(description = "Chi tiết lỗi theo từng field (chỉ với lỗi validation)")
    private Map<String, String> errors;

    @Schema(description = "Thời điểm phản hồi")
    private LocalDateTime timestamp;

    public static <T> ApiResponse<T> success(T data) {
        return success("Thành công", data);
    }

    public static <T> ApiResponse<T> success(String message, T data) {
        return ApiResponse.<T>builder()
                .success(true)
                .message(message)
                .data(data)
                .timestamp(LocalDateTime.now())
                .build();
    }

    public static <T> ApiResponse<T> error(String message) {
        return error(null, message);
    }

    public static <T> ApiResponse<T> error(String errorCode, String message) {
        return ApiResponse.<T>builder()
                .success(false)
                .errorCode(errorCode)
                .message(message)
                .timestamp(LocalDateTime.now())
                .build();
    }

    public static <T> ApiResponse<T> validationError(String message, Map<String, String> errors) {
        return ApiResponse.<T>builder()
                .success(false)
                .errorCode("VALIDATION_FAILED")
                .message(message)
                .errors(errors)
                .timestamp(LocalDateTime.now())
                .build();
    }
}
