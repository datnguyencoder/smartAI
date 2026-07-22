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
  purchaseRatio?: number;
  purchaseConversionRatio?: number;
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
  subtotalBeforeDiscount?: number;
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
  items?: OrderItemDto[];
};

export type OrderItemDto = {
  itemId?: number;
  itemName: string;
  lotId?: number;
  lotNumber?: string;
  quantity: number;
  unitPrice: number;
  subtotal?: number;
  discountAmount?: number;
  discountReason?: string;
};

export type HeldOrderItemDto = {
  itemId: number;
  itemCode: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
};

export type HeldOrderDto = {
  id: number;
  holdCode: string;
  cashierId?: number;
  shiftId?: number;
  customerName: string;
  customerPhone?: string;
  promotionCode?: string;
  loyaltyPointsRedeemed?: number;
  subtotalAmount: number;
  note?: string;
  status: 'ACTIVE' | 'RESTORED' | 'CANCELLED' | string;
  createdAt?: string;
  items: HeldOrderItemDto[];
};

export type CustomerDebtDto = {
  id: number;
  customerId: number;
  customerName: string;
  customerPhone?: string;
  orderId: number;
  orderCode: string;
  amount: number;
  paidAmount: number;
  remainingAmount: number;
  dueDate?: string;
  status: 'UNPAID' | 'PARTIAL' | 'OVERDUE' | 'PAID' | string;
  note?: string;
  createdAt?: string;
  payments?: {
    id: number;
    amount: number;
    paymentDate: string;
    paymentMethod?: string;
    note?: string;
  }[];
};

export type FinanceTransactionDto = {
  id: number;
  type: 'INCOME' | 'EXPENSE' | string;
  category: string;
  categoryId?: number;
  cashAccountId?: number;
  amount: number;
  paymentAccount: 'CASH' | 'BANK' | 'WALLET' | 'OTHER' | string;
  transactionDate: string;
  note?: string;
  createdBy?: number;
  createdAt?: string;
};

export type FinanceSummaryDto = {
  salesRevenue: number;
  refundAmount: number;
  totalIncome: number;
  totalExpense: number;
  netCashFlow: number;
  allTimeRevenue: number;
  currentStoreMoney: number;
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
  maxUsage?: number | null;
  usageCount?: number;
  maxPerCustomer?: number | null;
  stackable?: boolean;
  createdAt?: string;
};

export type PromotionValidateDto = {
  valid: boolean;
  promotionName?: string;
  code?: string;
  discountAmount: number;
  message?: string;
};

export type PromotionAnalyticsDto = {
  promotionId: number;
  name: string;
  code: string;
  active: boolean;
  usageCount: number;
  totalDiscountGiven: number;
  maxUsage?: number | null;
};

export type DiscountPlanAnalyticsDto = {
  planId: number;
  planName: string;
  dealType: string;
  active: boolean;
  ordersCount: number;
  totalDiscountGiven: number;
  maxUsage?: number | null;
  usageCount?: number;
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

export type OrderPrintPaymentLineDto = {
  paymentMethod: string;
  amount: number;
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
  vatRate?: number;
  totalAmount: number;
  paymentMethod: string;
  promotionCode?: string;
  loyaltyPointsRedeemed?: number;
  loyaltyPointsEarned?: number;
  shiftId?: number;
  storeName?: string;
  storeAddress?: string;
  storePhone?: string;
  receiptFooter?: string;
  paperWidth?: string;
  payments?: OrderPrintPaymentLineDto[];
  items: Array<{
    itemCode: string;
    itemName: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    discountAmount?: number;
    discountReason?: string;
    netAmount?: number;
  }>;
};

export type CategoryDto = {
  id: number;
  categoryName: string;
  parentId?: number;
  active: boolean;
  imageUrl?: string;
  uomCategories?: string;
};
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
export type UomCategory = 'COUNT' | 'WEIGHT' | 'VOLUME' | 'PACKAGE' | 'LENGTH' | 'OTHER';

export type UomDto = {
  id: number;
  uomName: string;
  category?: string;
  conversionRatio?: number;
  conversionUomId?: number;
  conversionUomName?: string;
  active?: boolean;
};

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

export type StockMovementDto = {
  itemId: number;
  itemName: string;
  fromLocationId?: number;
  fromLocationName?: string;
  toLocationId?: number;
  toLocationName?: string;
  locationId?: number;
  locationName?: string;
  lotId?: number;
  lotNumber?: string;
  actionType: string;
  quantity: number;
  quantityBefore?: number;
  quantityAfter?: number;
  note?: string;
  createdAt?: string;
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
  currentStock?: number;
  reservedQuantity?: number;
  availableQuantity?: number;
  minimumStock?: number;
  locationName?: string;
};

export type AuditLogDto = {
  id: number;
  action: string;
  detail?: string;
  username: string;
  actorRole?: string;
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
  supplierId?: number;
  supplierName?: string;
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

export type TrainJobDto = {
  jobId: string;
  status: 'QUEUED' | 'RUNNING' | 'DONE' | 'FAILED';
  startedAt?: string;
  completedAt?: string;
  errorMessage?: string;
  result?: {
    modelType?: string;
    mae?: number;
    rmse?: number;
    mape?: number;
    trainedAt?: string;
    itemsForecasted?: number;
  };
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
  totalRefundedAmount: number;
  discrepancyRate: number;
};

export type RefundReportDto = {
  totalRefundAmount: number;
  damagedRefundAmount: number;
  expiredRefundAmount: number;
  otherRefundAmount: number;
  totalRefundOrders: number;
  damagedRefundOrders: number;
  expiredRefundOrders: number;
  otherRefundOrders: number;
  refundOrders: ReturnOrderDto[];
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

export type InventoryNxtReportDto = {
  itemCode: string;
  itemName: string;
  unitName?: string;
  openingQty: number;
  openingValue: number;
  importedQty: number;
  importedValue: number;
  exportedQty: number;
  exportedValue: number;
  closingQty: number;
  closingValue: number;
  referencePrice: number;
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
  createdByUsername?: string;
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
  createdByUsername?: string;
  stocktakeDate: string;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'CONFIRMED' | 'CANCELLED';
  note?: string;
  submittedBy?: number;
  submittedByUsername?: string;
  submittedAt?: string;
  approvedBy?: number;
  approvedByUsername?: string;
  confirmedAt?: string;
  items: StocktakeItemDto[];
};

export type ReturnHandlingAction = 'RESTOCK' | 'DISCARD';

export type ReturnableOrderItemDto = {
  itemId: number;
  itemName: string;
  lotId?: number;
  lotNumber?: string;
  soldQuantity: number;
  returnedQuantity: number;
  remainingQuantity: number;
  unitPrice: number;
  estimatedRefund: number;
};

export type ReturnOrderItemDto = {
  itemId: number;
  itemName: string;
  lotId?: number;
  lotNumber?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  handlingAction?: ReturnHandlingAction;
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
  openingBalanceSourceShiftId?: number;
  closingCash?: number;
  expectedCash?: number;
  cashVariance?: number;
  varianceReason?: string;
  staffMismatchReported?: boolean;
  managerNote?: string;
  adminNote?: string;
  closingNote?: string;
  reviewedBy?: number;
  reviewedAt?: string;
  reviewNote?: string;
  totalOrders: number;
  totalRevenue: number;
  status: 'OPEN' | 'PENDING_REVIEW' | 'NEEDS_STAFF_UPDATE' | 'REVIEWED_BY_MANAGER' |
    'NEEDS_MANAGER_UPDATE' | 'APPROVED' | 'REJECTED' | 'CLOSED';
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

export type SupplierItemDto = {
  id: number;
  supplierId: number;
  supplierName?: string;
  skuItem: string;
  itemId?: number;
  itemName?: string;
  defaultCostPrice?: number;
  active: boolean;
};

export type CreateSupplierItemPayload = {
  supplierId: number;
  skuItem: string;
  defaultCostPrice?: number;
};

export type UpdateSupplierItemPayload = {
  defaultCostPrice?: number;
};

export type ShiftSummaryDto = {
  shiftId: number;
  cashierName?: string;
  openedAt: string;
  closedAt?: string;
  status: string;
  openingCash: number;
  closingCash?: number;
  expectedCash?: number;
  cashVariance?: number;
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  refundedOrders: number;
  grossSales: number;
  refundAmount: number;
  cashRefundAmount: number;
  nonCashRefundAmount: number;
  netRevenue: number;
  totalRevenue: number;
  cashSales: number;
  bankSales: number;
  cardSales: number;
  walletSales: number;
  otherSales: number;
  nonCashSales: number;
  cashDrawerEndingAmount: number;
  storeMoneyMovement: number;
  refundAmountAtClose: number;
  postCloseRefundAmount: number;
  revenueAfterPostCloseReturns: number;
};

export type ShiftBillFlowDto = {
  occurredAt: string;
  transactionType: 'SALE' | 'RETURN';
  shiftId: number;
  billCode: string;
  returnOrderId?: number;
  itemSummary: string;
  paymentMethods?: string;
  amount: number;
  afterShiftClosed: boolean;
};

export type ShiftMoneyFlowDto = {
  occurredAt: string;
  transactionType: string;
  referenceCode?: string;
  description?: string;
  paymentMethod?: string;
  moneyIn: number;
  moneyOut: number;
  amount: number;
  actorName?: string;
};

export type ShiftReturnedItemDto = {
  shiftId: number;
  returnOrderId: number;
  returnItemId: number;
  originalOrderCode: string;
  returnedAt: string;
  itemId: number;
  itemName: string;
  quantity: number;
  refundAmount: number;
  paymentMethods?: string;
};

export type ShiftDashboardDto = {
  currentStoreMoney: number;
  currentCashDrawerAmount: number;
  totalCashCollected: number;
  totalNonCashCollected: number;
  totalRefunded: number;
  activeShiftCount: number;
  pendingManagerCount: number;
  pendingAdminCount: number;
  statistics: {
    totalShifts: number;
    totalCompletedOrders: number;
    totalCancelledOrders: number;
    totalCashCollected: number;
    totalNonCashCollected: number;
    totalRefunded: number;
    currentStoreMoney: number;
  };
  recentShifts: ShiftDto[];
};

export type BestSellerReportDto = {
  itemId: number;
  itemCode: string;
  itemName: string;
  quantitySold: number;
  revenue: number;
};

export type BestSellerCategoryReportDto = {
  categoryId: number;
  categoryName: string;
  quantitySold: number;
  revenue: number;
};

export type CustomerDueReportDto = {
  debtId: number;
  customerId: number;
  customerName: string;
  orderId?: number;
  amount: number;
  paidAmount: number;
  remainingAmount: number;
  dueDate?: string;
  status: string;
};

export type SupplierDueReportDto = {
  debtId: number;
  supplierId: number;
  supplierName: string;
  purchaseOrderId?: number;
  amount: number;
  paidAmount: number;
  remainingAmount: number;
  dueDate?: string;
  status: string;
};

export type ProductExpiryReportDto = {
  itemId: number;
  itemCode: string;
  itemName: string;
  lotId?: number;
  lotNumber?: string;
  expiryDate?: string;
  daysUntilExpiry?: number;
  quantity: number;
  locationName?: string;
};

export type CashFlowReportDto = {
  date: string;
  type: 'INCOME' | 'EXPENSE' | string;
  category: string;
  amount: number;
  runningBalance: number;
};

export type ProfitLossReportDto = {
  date: string;
  revenue: number;
  costOfGoods: number;
  grossProfit: number;
  expenses: number;
  netProfit: number;
};

export type StockTransferOrderItemDto = {
  itemId: number;
  itemCode?: string;
  itemName: string;
  lotId?: number;
  lotNumber?: string;
  quantity: number;
};

export type StockTransferOrderDto = {
  id: number;
  transferCode: string;
  fromLocationId: number;
  fromLocationName: string;
  toLocationId: number;
  toLocationName: string;
  status: string;
  note?: string;
  createdBy?: number;
  confirmedAt?: string;
  createdAt: string;
  items: StockTransferOrderItemDto[];
};

export type PurchaseReturnItemDto = {
  itemId: number;
  itemName: string;
  lotId?: number;
  quantity: number;
  unitPrice: number;
  subtotal: number;
};

export type PurchaseReturnDto = {
  id: number;
  supplierId: number;
  supplierName: string;
  locationId: number;
  locationName: string;
  purchaseOrderId?: number;
  status: string;
  returnDate: string;
  totalAmount: number;
  note?: string;
  items: PurchaseReturnItemDto[];
};

export type FinanceCategoryDto = {
  id: number;
  name: string;
  type: 'INCOME' | 'EXPENSE' | string;
  active: boolean;
  createdAt?: string;
};

export type CashAccountDto = {
  id: number;
  accountName: string;
  accountType: string;
  balance: number;
  active: boolean;
  createdAt?: string;
};

export type AccountTransferDto = {
  id: number;
  fromAccountId: number;
  fromAccountName?: string;
  toAccountId: number;
  toAccountName?: string;
  amount: number;
  note?: string;
  transferredAt: string;
};

export type DiscountPlanDto = {
  id: number;
  planName: string;
  planType: 'CATEGORY' | 'SKU' | 'BUNDLE' | string;
  categoryId?: number;
  categoryName?: string;
  itemId?: number;
  itemName?: string;
  dealType: 'PERCENTAGE' | 'BOGO' | 'FIXED_AMOUNT' | string;
  bundleItems?: { itemId: number; itemName: string; requiredQty: number }[];
  customerSegment?: 'ALL' | 'MEMBER' | 'VIP' | string;
  discountPercent?: number;
  buyQuantity?: number;
  freeQuantity?: number;
  fixedAmount?: number;
  minQuantity?: number;
  startTime?: string;
  endTime?: string;
  maxUsage?: number | null;
  usageCount?: number;
  giftItemId?: number;
  giftItemName?: string;
  startDate?: string;
  endDate?: string;
  active: boolean;
  priority?: number;
  status?: 'SCHEDULED' | 'RUNNING' | 'EXPIRED' | 'DISABLED' | string;
  createdAt?: string;
};

export type BrandDto = {
  id: number;
  brandName: string;
  description?: string;
  active: boolean;
  createdAt?: string;
};

export type QuotationItemDto = {
  itemId: number;
  itemName: string;
  itemCode?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
};

export type QuotationDto = {
  id: number;
  quoteCode: string;
  customerName?: string;
  customerPhone?: string;
  status: string;
  subtotalAmount: number;
  validUntil?: string;
  note?: string;
  convertedOrderId?: number;
  createdAt: string;
  items: QuotationItemDto[];
};

export type GiftCardDto = {
  id: number;
  cardCode: string;
  initialBalance: number;
  currentBalance: number;
  status: string;
  issuedAt: string;
  expiresAt?: string;
  note?: string;
};

export type OnlineOrderRequestDto = {
  id: number;
  requestCode: string;
  customerName?: string;
  customerPhone?: string;
  deliveryAddress?: string;
  status: string;
  totalAmount: number;
  note?: string;
  createdAt: string;
};
