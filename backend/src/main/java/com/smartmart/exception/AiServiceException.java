package com.smartmart.exception;

public class AiServiceException extends AppException {
    public AiServiceException(String message) {
        super(ErrorCode.AI_SERVICE_UNAVAILABLE, message);
    }
}
