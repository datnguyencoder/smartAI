package com.smartmart.exception;

public class ExpiryDateRequiredException extends AppException {
    public ExpiryDateRequiredException() {
        super(ErrorCode.EXPIRY_DATE_REQUIRED);
    }
}
