package com.smartmart.enums;

public enum ReferenceType {
    ORDER,
    PURCHASE_ORDER,
    SCRAP_ORDER,
    STOCK_ADJUSTMENT,
    STOCKTAKE,
    /** @deprecated Legacy inventory logs only — transfer orders removed (single-store). */
    TRANSFER_ORDER,
    RETURN_ORDER,
    STOCK_TRANSFER_ORDER,
    PURCHASE_RETURN
}
