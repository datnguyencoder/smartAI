package com.smartmart.exception;

public class InsufficientStockException extends AppException {
    public InsufficientStockException(String message) {
        super(ErrorCode.INSUFFICIENT_STOCK, message);
    }
}
