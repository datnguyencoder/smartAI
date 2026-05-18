package com.smartmart.exception;

public class NotFoundException extends AppException {
    public NotFoundException(String message) {
        super(ErrorCode.NOT_FOUND, message);
    }
}
