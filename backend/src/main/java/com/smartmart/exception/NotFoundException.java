package com.smartmart.exception;

public class NotFoundException extends AppException {
    public NotFoundException(ErrorCode errorCode) {
        super(errorCode);
    }
    public NotFoundException(String message) {
        super(ErrorCode.NOT_FOUND, message);
    }

    public NotFoundException(ErrorCode errorCode, String message) {
        super(errorCode, message);
    }
}
