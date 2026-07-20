package com.smartmart.constant;

public final class AuditAction {
    private AuditAction() {}

    public static final String AUTH_LOGIN = "AUTH_LOGIN";
    public static final String AUTH_REFRESH = "AUTH_REFRESH";
    public static final String AUTH_LOGOUT = "AUTH_LOGOUT";

    public static final String USER_CREATE = "USER_CREATE";
    public static final String USER_UPDATE = "USER_UPDATE";
    public static final String USER_LOCKED = "USER_LOCKED";
    public static final String USER_UNLOCKED = "USER_UNLOCKED";
    public static final String USER_SOFT_DELETE = "USER_SOFT_DELETE";

    public static final String CUSTOMER_CREATE = "CUSTOMER_CREATE";
    public static final String CUSTOMER_UPDATE = "CUSTOMER_UPDATE";
    public static final String CUSTOMER_POINTS_EARNED = "CUSTOMER_POINTS_EARNED";

    public static final String CATEGORY_CREATE = "CATEGORY_CREATE";
    public static final String CATEGORY_UPDATE = "CATEGORY_UPDATE";
    public static final String CATEGORY_DELETE = "CATEGORY_DELETE";
    public static final String CATEGORY_ACTIVATE = "CATEGORY_ACTIVATE";
    public static final String CATEGORY_DEACTIVATE = "CATEGORY_DEACTIVATE";
    public static final String CATEGORY_MOVE_ITEMS = "CATEGORY_MOVE_ITEMS";
    public static final String ITEM_CREATE = "ITEM_CREATE";
    public static final String ITEM_UPDATE = "ITEM_UPDATE";
    public static final String ITEM_MOVE_CATEGORY = "ITEM_MOVE_CATEGORY";
    public static final String SUPPLIER_CREATE = "SUPPLIER_CREATE";
    public static final String SUPPLIER_UPDATE = "SUPPLIER_UPDATE";
    public static final String LOCATION_CREATE = "LOCATION_CREATE";
    public static final String LOCATION_UPDATE = "LOCATION_UPDATE";
    public static final String UOM_CREATE = "UOM_CREATE";

    public static final String ORDER_CREATE = "ORDER_CREATE";
    public static final String ORDER_CANCEL = "ORDER_CANCEL";
    public static final String PURCHASE_CREATE = "PURCHASE_CREATE";
    public static final String PURCHASE_RECEIVE = "PURCHASE_RECEIVE";
    public static final String PURCHASE_CANCEL = "PURCHASE_CANCEL";
    public static final String PURCHASE_RETURN_CREATE = "PURCHASE_RETURN_CREATE";
    public static final String STOCK_TRANSFER_CREATE = "STOCK_TRANSFER_CREATE";
    public static final String STOCK_TRANSFER_CONFIRM = "STOCK_TRANSFER_CONFIRM";
    public static final String STOCK_TRANSFER_CANCEL = "STOCK_TRANSFER_CANCEL";
    public static final String SCRAP_CREATE = "SCRAP_CREATE";
    public static final String SCRAP_APPROVE = "SCRAP_APPROVE";
    public static final String SCRAP_CANCEL = "SCRAP_CANCEL";

    public static final String INVENTORY_ALERT_CREATE = "INVENTORY_ALERT_CREATE";
    public static final String INVENTORY_ALERT_RESOLVE = "INVENTORY_ALERT_RESOLVE";

    public static final String PROMOTION_CREATE = "PROMOTION_CREATE";
    public static final String PROMOTION_UPDATE = "PROMOTION_UPDATE";
    public static final String PROMOTION_DELETE = "PROMOTION_DELETE";

    public static final String STOCKTAKE_CREATE = "STOCKTAKE_CREATE";
    public static final String STOCKTAKE_SUBMIT = "STOCKTAKE_SUBMIT";
    public static final String STOCKTAKE_APPROVE = "STOCKTAKE_APPROVE";
    public static final String STOCKTAKE_CONFIRM = "STOCKTAKE_CONFIRM";
    public static final String STOCKTAKE_CANCEL = "STOCKTAKE_CANCEL";

    public static final String RETURN_CREATE = "RETURN_CREATE";

    public static final String SHIFT_OPEN = "SHIFT_OPEN";
    public static final String SHIFT_CLOSE = "SHIFT_CLOSE";
    public static final String SHIFT_REVIEW = "SHIFT_REVIEW";
    public static final String SHIFT_STAFF_UPDATE = "SHIFT_STAFF_UPDATE";
    public static final String SHIFT_MANAGER_REVIEW = "SHIFT_MANAGER_REVIEW";
    public static final String SHIFT_MANAGER_UPDATE_REQUEST = "SHIFT_MANAGER_UPDATE_REQUEST";
    public static final String SHIFT_PAYMENT_CORRECTION = "SHIFT_PAYMENT_CORRECTION";
    public static final String SHIFT_APPROVE = "SHIFT_APPROVE";
    public static final String SHIFT_REJECT = "SHIFT_REJECT";
    public static final String SHIFT_OPENED = "SHIFT_OPENED";
    public static final String SHIFT_CLOSED = "SHIFT_CLOSED";
    public static final String SHIFT_RETURNED_TO_STAFF = "SHIFT_RETURNED_TO_STAFF";
    public static final String SHIFT_RETURNED_TO_MANAGER = "SHIFT_RETURNED_TO_MANAGER";
    public static final String PAYMENT_METHOD_CORRECTED = "PAYMENT_METHOD_CORRECTED";
    public static final String SHIFT_APPROVED = "SHIFT_APPROVED";
    public static final String BALANCE_ADJUSTED = "BALANCE_ADJUSTED";

    public static final String DEBT_CREATE = "DEBT_CREATE";
    public static final String DEBT_PAYMENT = "DEBT_PAYMENT";

    public static final String UOM_UPDATE = "UOM_UPDATE";
    public static final String UOM_ACTIVATE = "UOM_ACTIVATE";
    public static final String UOM_DEACTIVATE = "UOM_DEACTIVATE";



}
