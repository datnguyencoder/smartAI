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
    public static final String ITEM_CREATE = "ITEM_CREATE";
    public static final String ITEM_UPDATE = "ITEM_UPDATE";
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
    public static final String SCRAP_CREATE = "SCRAP_CREATE";
    public static final String SCRAP_APPROVE = "SCRAP_APPROVE";
    public static final String SCRAP_CANCEL = "SCRAP_CANCEL";

    public static final String INVENTORY_ALERT_CREATE = "INVENTORY_ALERT_CREATE";
    public static final String INVENTORY_ALERT_RESOLVE = "INVENTORY_ALERT_RESOLVE";

    public static final String PROMOTION_CREATE = "PROMOTION_CREATE";
    public static final String PROMOTION_UPDATE = "PROMOTION_UPDATE";
    public static final String PROMOTION_DELETE = "PROMOTION_DELETE";

}
