package com.smartmart.exception;

public class ForbiddenException extends AppException {
    public ForbiddenException(String message) {
        super(ErrorCode.FORBIDDEN, message);
    }
}
