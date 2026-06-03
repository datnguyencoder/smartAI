package com.smartmart.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public enum ErrorCode {
    // Generic
    SYSTEM_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "Lỗi hệ thống"),
    BAD_REQUEST(HttpStatus.BAD_REQUEST, "Yêu cầu không hợp lệ"),
    VALIDATION_FAILED(HttpStatus.BAD_REQUEST, "Dữ liệu không hợp lệ"),
    NOT_FOUND(HttpStatus.NOT_FOUND, "Không tìm thấy dữ liệu"),
    CONFLICT(HttpStatus.CONFLICT, "Dữ liệu đã tồn tại hoặc xung đột"),
    UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "Yêu cầu xác thực tài khoản"),
    FORBIDDEN(HttpStatus.FORBIDDEN, "Bạn không có quyền truy cập chức năng này"),

    // Auth domain
    INVALID_CREDENTIALS(HttpStatus.UNAUTHORIZED, "Email hoặc mật khẩu không chính xác"),
    TOKEN_EXPIRED(HttpStatus.UNAUTHORIZED, "Phiên đăng nhập đã hết hạn"),
    TOKEN_INVALID(HttpStatus.UNAUTHORIZED, "Token không hợp lệ"),
    ACCOUNT_INACTIVE(HttpStatus.FORBIDDEN, "Tài khoản đã bị khóa"),

    // Inventory / business domain
    INSUFFICIENT_STOCK(HttpStatus.BAD_REQUEST, "Số lượng hàng tồn kho không đủ"),
    PRODUCT_EXPIRED(HttpStatus.BAD_REQUEST, "Sản phẩm đã hết hạn sử dụng"),
    EXPIRY_DATE_REQUIRED(HttpStatus.BAD_REQUEST, "Yêu cầu nhập hạn sử dụng cho sản phẩm có quản lý lô"),
    INVALID_EXPIRY_DATE(HttpStatus.BAD_REQUEST, "Hạn sử dụng không hợp lệ"),
    SUPPLIER_INACTIVE(HttpStatus.BAD_REQUEST, "Nhà cung cấp không hoạt động"),

    // External AI service
    AI_SERVICE_UNAVAILABLE(HttpStatus.SERVICE_UNAVAILABLE, "Dịch vụ AI tạm thời không khả dụng");

    private final HttpStatus status;
    private final String message;

    ErrorCode(HttpStatus status, String message) {
        this.status = status;
        this.message = message;
    }
}
