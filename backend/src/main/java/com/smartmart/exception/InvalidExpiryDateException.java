package com.smartmart.exception;

public class InvalidExpiryDateException extends AppException {
    public InvalidExpiryDateException(String message) {
        super(ErrorCode.INVALID_EXPIRY_DATE, message);
    }
}
