package com.smartmart.exception;

public class SupplierInactiveException extends AppException {
    public SupplierInactiveException() {
        super(ErrorCode.SUPPLIER_INACTIVE);
    }
}
