export type UserStatus = 'ACTIVE' | 'LOCKED' | 'INACTIVE';
export type Role =
  | 'ROLE_ADMIN'
  | 'ROLE_MANAGER'
  | 'ROLE_STAFF'
  | 'ROLE_WAREHOUSE'
  | 'ROLE_ANALYST'
  | string;

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
  role: Role;
  status: UserStatus;
};

export type AuthDto = {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  user: UserDto;
};

export type ItemDto = {
  id: number;
  itemCode: string;
  itemName: string;
  categoryId?: number;
  categoryName?: string;
  costPrice: number;
  sellingPrice: number;
  minimumStock: number;
  totalAvailableQty?: number;
  soldQty?: number;
  hasExpiry: boolean;
  active: boolean;
  imageUrl?: string;
  baseUomId?: number;
  baseUomName?: string;
  purchaseUomId?: number;
  purchaseUomName?: string;
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
  cashierName?: string;
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
  email?: string;
  address?: string;
  taxCode?: string;
  note?: string;
  active: boolean;
};
export type LocationDto = {
  id: number;
  locationName: string;
  locationType?: string;
  locationCode?: string;
  capacity?: number;
  parentId?: number;
  active?: boolean;
};
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

export type CreateUserPayload = {
  username: string;
  password: string;
  email: string;
  fullName?: string;
  role: Role;
};

export type UpdateUserPayload = {
  fullName?: string;
  email?: string;
  role?: Role;
  status?: UserStatus;
};

export type InventoryLogDto = {
  id: number;
  itemId: number;
  itemName: string;
  locationId: number;
  locationName: string;
  userId?: string;
  referenceType?: string;
  referenceId?: number;
  actionType: string;
  quantityBefore: number;
  quantityChange: number;
  quantityAfter: number;
  note?: string;
  createdAt: string;
};

