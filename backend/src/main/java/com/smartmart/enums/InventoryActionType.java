package com.smartmart.enums;

public enum InventoryActionType {
    PURCHASE_RECEIVE,
    SALE,
    SALE_CANCEL,
    SCRAP,
    SCRAP_PENDING,
    SCRAP_COMPLETED,
    SCRAP_CANCELLED,
    ADJUSTMENT,
    /** @deprecated Legacy inventory logs only — transfer between locations removed (single-store). */
    TRANSFER_OUT,
    /** @deprecated Legacy inventory logs only — transfer between locations removed (single-store). */
    TRANSFER_IN,
    SALE_RETURN
}
