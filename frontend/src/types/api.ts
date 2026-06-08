export type ApiEnvelope<T> = {
  success: boolean;
  message?: string;
  data?: T;
  errorCode?: string;
  errors?: Record<string, string>;
};

export type UserDto = {
  id: string;
  username: string;
  email: string;
  fullName?: string;
  role: string;
};

export type AuthDto = {
  accessToken: string;
  tokenType: string;
  user: UserDto;
};

export type ItemDto = {
  id: number;
  itemCode: string;
  itemName: string;
  categoryName?: string;
  costPrice: number;
  sellingPrice: number;
  minimumStock: number;
  totalAvailableQty?: number;
  soldQty?: number;
  hasExpiry: boolean;
  active: boolean;
  imageUrl?: string;
};

export type PageResponseDto<T> = {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
};

export type OrderDto = {
  id: number;
  orderCode: string;
  customerName: string;
  orderDate: string;
  status: string;
  totalAmount: number;
  paymentMethod?: string;
  items?: Array<{ itemName: string; quantity: number; unitPrice: number }>;
};

export type CategoryDto = { id: number; categoryName: string; active: boolean; imageUrl?: string };
export type SupplierDto = {
  id: number;
  supplierName: string;
  contactPerson?: string;
  phone?: string;
  active: boolean;
};
export type LocationDto = { id: number; locationName: string; locationType?: string };
export type UomDto = { id: number; uomName: string };

export type PurchaseOrderItemDto = {
  id: number;
  itemId: number;
  itemName: string;
  orderedQty: number;
  receivedQty: number;
  unitPrice: number;
  subtotal: number;
};

export type InventoryItemDto = {
  id: number;
  itemId: number;
  itemCode: string;
  itemName: string;
  locationId: number;
  locationName: string;
  lotId?: number;
  lotNumber?: string;
  expiryDate?: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
};

export type InventoryAlertDto = {
  id: number;
  itemId: number;
  itemCode: string;
  itemName: string;
  alertType: string;
  severity: string;
  message: string;
  resolved: boolean;
  createdAt: string;
};

export type DashboardSummaryDto = {
  todayRevenue?: number;
  todayOrders?: number;
  lowStockCount?: number;
  activeAlerts?: number;
  [key: string]: unknown;
};

export type ForecastResultDto = Record<string, unknown>;

export type PurchaseOrderDto = {
  id: number;
  supplierId: number;
  supplierName: string;
  locationId: number;
  locationName: string;
  status: string;
  purchaseDate: string;
  completedAt?: string;
  totalAmount: number;
  items: PurchaseOrderItemDto[];
};
