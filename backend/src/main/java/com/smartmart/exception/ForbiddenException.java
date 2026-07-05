package com.smartmart.exception;

public class ForbiddenException extends AppException {
    public ForbiddenException(ErrorCode errorCode) {
        super(errorCode);
    }

    public ForbiddenException(String message) {
        super(ErrorCode.FORBIDDEN, message);
    }

    public ForbiddenException(ErrorCode errorCode, String message) {
        super(errorCode, message);
    }
}
