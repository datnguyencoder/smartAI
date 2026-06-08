package com.smartmart.exception;

public class ConflictException extends AppException {
    public ConflictException(String message) {
        super(ErrorCode.CONFLICT, message);
    }
    public ConflictException(ErrorCode errorCode, String message) {
        super(errorCode, message);
    }
}
