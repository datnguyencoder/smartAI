export type UserStatus = 'ACTIVE' | 'LOCKED' | 'INACTIVE';
export type Role =
  | 'ROLE_ADMIN'
  | 'ROLE_MANAGER'
  | 'ROLE_STAFF'
  | 'ROLE_WAREHOUSE'
  | 'ROLE_ANALYST';

export type ApiEnvelope<T> = {
  success: boolean;
  message?: string;
  data?: T;
  errorCode?: string;
  errors?: Record<string, string>;
};

export type UserDto = {
  id: number;
  username: string;
  email: string;
  fullName?: string;
  role: Role;
  status: UserStatus;
};

export type AuthDto = {
  accessToken: string;
  refreshToken?: string;
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
  customerPhone?: string;
  discountAmount?: number;
  promotionCode?: string;
  cashierName?: string;
  orderDate: string;
  status: string;
  totalAmount: number;
  paymentMethod?: string;
  loyaltyPointsRedeemed?: number;
  loyaltyPointsEarned?: number;
  customerLoyaltyPoints?: number;
  customerTier?: string;
  items?: Array<{ itemId?: number; itemName: string; quantity: number; unitPrice: number }>;
};

export type CustomerDto = {
  id: number;
  fullName: string;
  phone: string;
  email?: string;
  loyaltyPoints: number;
  tier: 'REGULAR' | 'SILVER' | 'GOLD' | string;
  createdAt?: string;
};

export type PromotionDto = {
  id: number;
  name: string;
  code: string;
  type: 'PERCENTAGE' | 'FIXED_AMOUNT' | string;
  value: number;
  minOrder: number;
  startDate?: string;
  endDate?: string;
  active: boolean;
  createdAt?: string;
};

export type PromotionValidateDto = {
  valid: boolean;
  promotionName?: string;
  code?: string;
  discountAmount: number;
  message?: string;
};

export type SettingDto = {
  id: number;
  key: string;
  value: string;
  description?: string;
};

export type ForecastDailyPointDto = { date: string; predictedQty: number; confidenceLow?: number; confidenceHigh?: number };

export type ForecastItemDetailDto = {
  itemId: number;
  itemName: string;
  pred7d: number;
  pred14d: number;
  pred30d: number;
  modelType?: string;
  forecastDate?: string;
  confidenceLow?: number;
  confidenceHigh?: number;
  dailySeries: ForecastDailyPointDto[];
};

export type OrderPrintDto = {
  id: number;
  orderCode: string;
  customerName: string;
  customerPhone?: string;
  orderDate: string;
  staffName: string;
  subtotalAmount?: number;
  discountAmount?: number;
  vatAmount?: number;
  totalAmount: number;
  paymentMethod: string;
  promotionCode?: string;
  loyaltyPointsRedeemed?: number;
  loyaltyPointsEarned?: number;
  items: Array<{
    itemCode: string;
    itemName: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
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
  uomName?: string;
  lotCode?: string;
  expiryDate?: string;
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
  daysUntilExpiry?: number;
  riskQuantity?: number;
};

export type ItemLotDto = {
  id: number;
  itemId: number;
  itemName: string;
  lotNumber: string;
  expiryDate?: string;
  createdAt: string;
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

export type AuditLogDto = {
  id: number;
  action: string;
  detail?: string;
  username: string;
  createdAt: string;
  beforeData?: string | null;
  afterData?: string | null;
  ipAddress?: string | null;
  entityType?: string | null;
  entityId?: string | null;
};

export type DashboardSummaryDto = {
  todayRevenue?: number;
  todayOrders?: number;
  lowStockCount?: number;
  nearExpiryCount?: number;
  activeAlerts?: number;
  [key: string]: unknown;
};

export type ForecastResultDto = {
  itemId: number;
  itemCode?: string;
  itemName?: string;
  pred7d?: number;
  pred14d?: number;
  pred30d?: number;
  modelType?: string;
  confidenceLow?: number;
  confidenceHigh?: number;
  stockOnHand?: number;
  shortageQty?: number;
  surplusQty?: number;
  riskLevel?: 'OK' | 'WARNING' | 'CRITICAL' | 'OVERSTOCK';
  recommendation?: string;
};

export type ReorderRecommendationDto = {
  itemId: number;
  itemCode?: string;
  itemName: string;
  suggestedQty: number;
  currentAvailable: number;
  predictedDemand7d?: number;
  predictedDemand14d?: number;
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW' | string;
  source: 'AI' | 'FALLBACK' | string;
  reason?: string;
};

export type PromotionRecommendationDto = {
  id: number;
  itemId: number;
  itemCode?: string;
  itemName?: string;
  discountPercent: number;
  reason?: string;
  status: string;
  promotionId?: number;
  promotionCode?: string;
  createdAt?: string;
};

export type AiStatusDto = {
  aiOnline: boolean;
  modelLoaded: boolean;
  aiVersion?: string;
  lastTrainedAt?: string;
  modelType?: string;
  totalForecasts?: number;
};

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
};

// --------- Report DTOs ---------
export type TopProductDto = {
  itemId: number;
  itemCode: string;
  itemName: string;
  quantitySold: number;
  revenue: number;
};

export type SalesReportDto = {
  period: string;
  totalOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  totalCost: number;
  grossProfit: number;
  totalItemsSold: number;
  topProducts: TopProductDto[];
};

export type PurchaseReportDto = {
  supplierId: number;
  supplierName: string;
  totalOrders: number;
  totalAmount: number;
  totalItemTypes: number;
  totalQuantity: number;
};

export type InventoryReportDto = {
  itemId: number;
  itemCode: string;
  itemName: string;
  categoryName: string;
  currentStock: number;
  totalPurchased: number;
  totalSold: number;
  totalScrapped: number;
  shrinkage: number;
  turnoverRate: number;
  nearestExpiryDate?: string;
  daysUntilExpiry?: number;
};

export type InventoryLogDto = {
  id: number;
  itemId: number;
  itemName: string;
  locationId: number;
  locationName: string;
  userId?: number;
  referenceType?: string;
  referenceId?: number;
  actionType: string;
  quantityBefore: number;
  quantityChange: number;
  quantityAfter: number;
  note?: string;
  createdAt: string;
};

export type ScrapOrderItemDto = {
  itemId: number;
  itemName: string;
  lotId?: number;
  lotNumber?: string;
  quantity: number;
  reason?: string;
};

export type ScrapOrderDto = {
  id: number;
  locationId: number;
  locationName: string;
  createdBy: number;
  scrapDate: string;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  note?: string;
  items: ScrapOrderItemDto[];
};

export type StocktakeItemDto = {
  itemId: number;
  itemName: string;
  itemCode: string;
  lotId?: number;
  lotNumber?: string;
  systemQuantity: number;
  actualQuantity?: number;
  variance?: number;
  note?: string;
};

export type StocktakeDto = {
  id: number;
  locationId: number;
  locationName: string;
  createdBy?: number;
  stocktakeDate: string;
  status: 'DRAFT' | 'CONFIRMED' | 'CANCELLED';
  note?: string;
  confirmedAt?: string;
  items: StocktakeItemDto[];
};

export type TransferOrderItemDto = {
  itemId: number;
  itemName: string;
  lotId?: number;
  lotNumber?: string;
  quantity: number;
  note?: string;
};

export type TransferOrderDto = {
  id: number;
  fromLocationId: number;
  fromLocationName: string;
  toLocationId: number;
  toLocationName: string;
  createdBy?: number;
  transferDate: string;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  note?: string;
  completedAt?: string;
  items: TransferOrderItemDto[];
};

export type ReturnOrderItemDto = {
  itemId: number;
  itemName: string;
  lotId?: number;
  lotNumber?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
};

export type ReturnOrderDto = {
  id: number;
  originalOrderId: number;
  originalOrderCode: string;
  createdBy?: number;
  returnDate: string;
  status: string;
  reason?: string;
  refundAmount: number;
  note?: string;
  items: ReturnOrderItemDto[];
};

export type ShiftDto = {
  id: number;
  cashierId: number;
  cashierName?: string;
  openedAt: string;
  closedAt?: string;
  openingCash: number;
  closingCash?: number;
  expectedCash?: number;
  cashVariance?: number;
  varianceReason?: string;
  reviewedBy?: number;
  reviewedAt?: string;
  reviewNote?: string;
  totalOrders: number;
  totalRevenue: number;
  status: 'OPEN' | 'PENDING_REVIEW' | 'CLOSED';
  note?: string;
};

export type DebtPaymentDto = {
  id: number;
  amount: number;
  paymentDate: string;
  paymentMethod?: string;
  note?: string;
  createdBy?: number;
};

export type SupplierDebtDto = {
  id: number;
  supplierId: number;
  supplierName: string;
  purchaseOrderId?: number;
  amount: number;
  paidAmount: number;
  remainingAmount: number;
  dueDate?: string;
  status: 'UNPAID' | 'PARTIAL' | 'OVERDUE' | 'PAID';
  note?: string;
  payments?: DebtPaymentDto[];
};
