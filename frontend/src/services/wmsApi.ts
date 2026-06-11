import { getRefreshToken } from '../lib/authSession';
import { apiRequest, ApiClientError } from './apiClient';
import type {
  AuditLogDto,
  AuthDto,
  CategoryDto,
  DashboardSummaryDto,
  InventoryAlertDto,
  InventoryItemDto,
  InventoryLogDto,
  InventoryReportDto,
  ItemDto,
  LocationDto,
  OrderDto,
  PageResponseDto,
  PurchaseOrderDto,
  PurchaseReportDto,
  SalesReportDto,
  CustomerDto,
  PromotionDto,
  PromotionValidateDto,
  SettingDto,
  SupplierDto,
  UomDto,
  UserDto,
  CreateUserPayload,
  UpdateUserPayload,
} from '../types/api';

export async function login(username: string, password: string) {
  const data = await apiRequest<AuthDto>(
    '/api/v1/auth/login',
    { method: 'POST', body: JSON.stringify({ username, password }) },
    false
  );
  return data;
}

export function logout() {
  const refreshToken = getRefreshToken();
  return apiRequest<void>('/api/v1/auth/logout', {
    method: 'POST',
    body: JSON.stringify(refreshToken ? { refreshToken } : {}),
  });
}

export function fetchMe() {
  return apiRequest<UserDto>('/api/v1/auth/me');
}

export function refreshAuth() {
  const refreshToken = getRefreshToken();
  return apiRequest<AuthDto>(
    '/api/v1/auth/refresh',
    {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    },
    false
  );
}

export function fetchUsers() {
  return apiRequest<UserDto[]>('/api/v1/users');
}

export function createUser(payload: CreateUserPayload) {
  return apiRequest<UserDto>('/api/v1/users', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateUser(id: number, payload: UpdateUserPayload) {
  return apiRequest<UserDto>(`/api/v1/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}


export function lockUser(id: number) {
  return apiRequest<void>(`/api/v1/users/${id}/lock`, {
    method: 'POST',
  });
}

export function softDeleteUser(id: number) {
  return apiRequest<void>(`/api/v1/users/${id}`, {
    method: 'DELETE',
  });
}

export function fetchInventoryAlerts() {
  return apiRequest<InventoryAlertDto[]>('/api/v1/inventory-alerts');
}

export function resolveInventoryAlert(id: number) {
  return apiRequest<InventoryAlertDto>(`/api/v1/inventory-alerts/${id}/resolve`, { method: 'PATCH' });
}

export function fetchRecentAuditLogs(limit = 20) {
  return apiRequest<AuditLogDto[]>(`/api/v1/audit-logs/recent?limit=${limit}`);
}

export function fetchItems(search?: string, categoryId?: number) {
  const params = new URLSearchParams();
  if (search) params.set('q', search);
  if (categoryId) params.set('categoryId', String(categoryId));
  const query = params.toString() ? `?${params.toString()}` : '';
  return apiRequest<ItemDto[]>(`/api/v1/items${query}`);

}

export function fetchItemsPaged(page = 0, size = 50, search?: string) {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  if (search) params.set('q', search);
  return apiRequest<PageResponseDto<ItemDto>>(`/api/v1/items?${params}`);
}

export function fetchItemByBarcode(barcode: string) {
  return apiRequest<ItemDto>(`/api/v1/items?barcode=${encodeURIComponent(barcode.trim())}`);
}

export function createItem(payload: {
  itemCode: string;
  itemName: string;
  categoryId?: number;
  baseUomId: number;
  purchaseUomId?: number;
  costPrice: number;
  sellingPrice: number;
  minimumStock?: number;
  hasExpiry?: boolean;
  imageUrl?: string;
}) {
  return apiRequest<ItemDto>('/api/v1/items', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateItem(
  id: number,
  payload: {
    itemName?: string;
    categoryId?: number;
    costPrice?: number;
    sellingPrice?: number;
    minimumStock?: number;
    hasExpiry?: boolean;
    imageUrl?: string;
  }
) {
  return apiRequest<ItemDto>(`/api/v1/items/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function createOrder(payload: {
  customerName?: string;
  customerPhone?: string;
  promotionCode?: string;
  paymentMethod?: string;
  items: { itemId: number; quantity: number }[];
}) {
  return apiRequest<OrderDto>('/api/v1/orders', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchOrders(customerPhone?: string) {
  try {
    const qs = customerPhone ? `?customerPhone=${encodeURIComponent(customerPhone)}` : '';
    return await apiRequest<OrderDto[]>(`/api/v1/orders${qs}`);
  } catch (e: any) {
    // Nếu không có quyền (403), trả về mảng rỗng để UI không báo lỗi
    if (e instanceof ApiClientError && e.status === 403) {
      return [] as OrderDto[];
    }
    throw e;
  }
}

export function fetchCustomers(phone?: string, q?: string) {
  const params = new URLSearchParams();
  if (phone) params.set('phone', phone);
  if (q) params.set('q', q);
  const qs = params.toString() ? `?${params}` : '';
  return apiRequest<CustomerDto[]>(`/api/v1/customers${qs}`);
}

export function createCustomer(payload: { fullName: string; phone: string; email?: string }) {
  return apiRequest<CustomerDto>('/api/v1/customers', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function fetchPromotions(activeOnly = false) {
  const qs = activeOnly ? '?activeOnly=true' : '';
  return apiRequest<PromotionDto[]>(`/api/v1/promotions${qs}`);
}

export function createPromotion(payload: {
  name: string;
  code: string;
  type: string;
  value: number;
  minOrder?: number;
  startDate?: string;
  endDate?: string;
  active?: boolean;
}) {
  return apiRequest<PromotionDto>('/api/v1/promotions', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updatePromotion(id: number, payload: Partial<PromotionDto>) {
  return apiRequest<PromotionDto>(`/api/v1/promotions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function deletePromotion(id: number) {
  return apiRequest<void>(`/api/v1/promotions/${id}`, { method: 'DELETE' });
}

export function validatePromotion(code: string, orderSubtotal: number) {
  return apiRequest<PromotionValidateDto>('/api/v1/promotions/validate', {
    method: 'POST',
    body: JSON.stringify({ code, orderSubtotal }),
  });
}

export function fetchPromotionRecommendations(pendingOnly = false) {
  const qs = pendingOnly ? '?pendingOnly=true' : '';
  return apiRequest<import('../types/api').PromotionRecommendationDto[]>(
    `/api/v1/promotions/recommendations${qs}`
  );
}

export function approvePromotionRecommendation(id: number) {
  return apiRequest<import('../types/api').PromotionRecommendationDto>(
    `/api/v1/promotions/recommendations/${id}/approve`,
    { method: 'POST' }
  );
}

export function rejectPromotionRecommendation(id: number) {
  return apiRequest<import('../types/api').PromotionRecommendationDto>(
    `/api/v1/promotions/recommendations/${id}/reject`,
    { method: 'POST' }
  );
}

export function aiSuggestPromotion(itemId: number) {
  return apiRequest<{ suggestion: string; promotionId: number; discountPercent: number; status: string }>(
    `/api/v1/ai-insight/suggest-promotion/${itemId}`,
    { method: 'POST' }
  );
}

export function fetchSettings() {
  return apiRequest<SettingDto[]>('/api/v1/settings');
}

export function updateSetting(key: string, value: string, description?: string) {
  return apiRequest<SettingDto>(`/api/v1/settings/${encodeURIComponent(key)}`, {
    method: 'PUT',
    body: JSON.stringify({ value, description }),
  });
}

export function fetchOrdersPaged(page = 0, size = 10, search?: string, status?: string, fromDate?: string, toDate?: string) {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  if (search) params.set('search', search);
  if (status && status !== 'ALL') params.set('status', status);
  if (fromDate) params.set('fromDate', fromDate);
  if (toDate) params.set('toDate', toDate);
  return apiRequest<PageResponseDto<OrderDto>>(`/api/v1/orders/paged?${params}`);
}

export function suggestCustomers(keyword: string) {
  return apiRequest<string[]>(`/api/v1/orders/customers/suggest?q=${encodeURIComponent(keyword)}`);
}

export function fetchCategories() {
  return apiRequest<CategoryDto[]>('/api/v1/categories');
}

export function fetchSuppliers() {
  return apiRequest<SupplierDto[]>('/api/v1/suppliers');
}

export function updateSupplier(id: number, payload: Partial<SupplierDto>) {
  return apiRequest<SupplierDto>(`/api/v1/suppliers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function fetchLocations() {
  return apiRequest<LocationDto[]>('/api/v1/locations');
}

export function updateLocation(id: number, payload: Partial<LocationDto>) {
  return apiRequest<LocationDto>(`/api/v1/locations/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function fetchUoms() {
  return apiRequest<UomDto[]>('/api/v1/uoms');
}

export function createPurchaseOrder(payload: {
  supplierId: number;
  locationId: number;
  items: { itemId: number; quantity: number; unitPrice: number; expiryDate?: string }[];
}) {
  return apiRequest<PurchaseOrderDto>('/api/v1/purchase-orders', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function fetchPurchaseOrdersPaged(page = 0, size = 10, status?: string, keyword?: string, supplierId?: number, locationId?: number, fromDate?: string, toDate?: string) {
  const params = new URLSearchParams({ page: String(page), size: String(size), sort: 'id,desc' });
  if (status && status !== 'ALL') params.set('status', status);
  if (keyword) params.set('search', keyword);
  if (supplierId) params.set('supplierId', String(supplierId));
  if (locationId) params.set('locationId', String(locationId));
  if (fromDate) params.set('fromDate', fromDate);
  if (toDate) params.set('toDate', toDate);
  return apiRequest<PageResponseDto<PurchaseOrderDto>>(`/api/v1/purchase-orders?${params}`);
}

export function receivePurchaseOrder(purchaseId: number) {
  return apiRequest<PurchaseOrderDto>(`/api/v1/purchase-orders/${purchaseId}/receive`, {
    method: 'POST',
  });
}

export function cancelOrder(orderId: number) {
  return apiRequest<OrderDto>(`/api/v1/orders/${orderId}/cancel`, { method: 'POST' });
}

export function cancelPurchaseOrder(purchaseId: number) {
  return apiRequest<PurchaseOrderDto>(`/api/v1/purchase-orders/${purchaseId}/cancel`, { method: 'POST' });
}

// --------- Purchase Order APIs (new) ---------
// Get list of all purchase orders (no pagination)
export function fetchPurchaseOrders() {
  return apiRequest<PurchaseOrderDto[]>('/api/v1/purchase-orders');
}

// Get purchase order detail by ID
export function fetchPurchaseOrderById(purchaseId: number) {
  return apiRequest<PurchaseOrderDto>(`/api/v1/purchase-orders/${purchaseId}`);
}


export function fetchInventory() {
  return apiRequest<InventoryItemDto[]>('/api/v1/inventory');
}

export function fetchNearExpiry() {
  return apiRequest<InventoryItemDto[]>('/api/v1/inventory/near-expiry');
}

export function fetchScrapOrders(status?: string) {
  const params = new URLSearchParams();
  if (status) {
    params.set('status', status);
  }
  const qs = params.toString() ? `?${params.toString()}` : '';
  return apiRequest<import('../types/api').ScrapOrderDto[]>(`/api/v1/scrap-orders${qs}`);
}

export function createScrapOrder(payload: {
  locationId: number;
  items: { itemId: number; lotId?: number; quantity: number; reason?: string }[];
}) {
  return apiRequest<unknown>('/api/v1/scrap-orders', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function approveScrapOrder(id: number) {
  return apiRequest<unknown>(`/api/v1/scrap-orders/${id}/approve`, { method: 'POST' });
}

export function cancelScrapOrder(id: number, reason: string) {
  const params = new URLSearchParams({ reason: reason });
  return apiRequest<unknown>(`/api/v1/scrap-orders/${id}/cancel?${params}`, { method: 'POST' });
}

export function fetchDashboardSummary() {
  return apiRequest<DashboardSummaryDto>('/api/v1/dashboard/summary');
}

export function fetchDashboardRevenue() {
  return apiRequest<{ day: string; revenue: number }[]>('/api/v1/dashboard/revenue');
}

export function trainForecast() {
  return apiRequest<Record<string, unknown>>('/api/v1/forecast/train', { method: 'POST' });
}

export function runForecast() {
  return apiRequest<Record<string, unknown>>('/api/v1/forecast/run', { method: 'POST' });
}

export function fetchForecastResults() {
  return apiRequest<import('../types/api').ForecastResultDto[]>('/api/v1/forecast/results');
}

export function fetchForecastItemDetail(itemId: number) {
  return apiRequest<import('../types/api').ForecastItemDetailDto>(`/api/v1/forecast/results/${itemId}`);
}

export function fetchReorderRecommendations() {
  return apiRequest<Record<string, unknown>[]>('/api/v1/forecast/recommendations');
}

export function fetchAiStatus() {
  return apiRequest<import('../types/api').AiStatusDto>('/api/v1/forecast/ai-status');
}

export function fetchOrderPrint(orderId: number) {
  return apiRequest<import('../types/api').OrderPrintDto>(`/api/v1/orders/${orderId}/print`);
}

export function fetchInventoryLogs(
  page = 0,
  size = 20,
  actionType?: string,
  itemId?: number,
  locationId?: number,
  search?: string,
  fromDate?: string,
  toDate?: string
) {
  const params = new URLSearchParams({ page: String(page), size: String(size), sort: 'id,desc' });
  if (actionType) params.set('actionType', actionType);
  if (itemId) params.set('itemId', String(itemId));
  if (locationId) params.set('locationId', String(locationId));
  if (search) params.set('search', search);
  if (fromDate) params.set('fromDate', fromDate);
  if (toDate) params.set('toDate', toDate);
  return apiRequest<PageResponseDto<InventoryLogDto>>(`/api/v1/inventory/logs?${params}`);
}

export function aiChat(message: string) {
  return apiRequest<string>('/api/v1/ai-insight/chat', {
    method: 'POST',
    body: JSON.stringify({ message }),
  });
}

export function aiExplainRisk(payload: Record<string, unknown>) {
  return apiRequest<string>('/api/v1/ai-insight/explain-risk', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// --------- Report APIs ---------
export function fetchSalesReport(from?: string, to?: string, groupBy?: string) {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  if (groupBy) params.set('groupBy', groupBy);
  const qs = params.toString();
  return apiRequest<SalesReportDto[]>(`/api/v1/reports/sales${qs ? `?${qs}` : ''}`);
}

export function fetchPurchaseReport(from?: string, to?: string) {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const qs = params.toString();
  return apiRequest<PurchaseReportDto[]>(`/api/v1/reports/purchase${qs ? `?${qs}` : ''}`);
}

export function fetchInventoryReport(from?: string, to?: string) {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const qs = params.toString();
  return apiRequest<InventoryReportDto[]>(`/api/v1/reports/inventory${qs ? `?${qs}` : ''}`);
}
export function fetchAuditLogs(page = 0, size = 10) {
  return apiRequest<PageResponseDto<AuditLogDto>>(`/api/v1/audit-logs?page=${page}&size=${size}`);
}

export function fetchAuditLogsByAction(action: string, page = 0, size = 10) {
  return apiRequest<PageResponseDto<AuditLogDto>>(
    `/api/v1/audit-logs/action/${encodeURIComponent(action)}?page=${page}&size=${size}`
  );
}

export function fetchAuditLogsByUsername(username: string, page = 0, size = 10) {
  return apiRequest<PageResponseDto<AuditLogDto>>(
    `/api/v1/audit-logs/username/${encodeURIComponent(username)}?page=${page}&size=${size}`
  );
}

export function fetchAuditLogsByEntity(entityType: string, entityId?: string, page = 0, size = 10) {
  const params = new URLSearchParams({
    entityType,
    page: String(page),
    size: String(size),
  });

  if (entityId && entityId.trim()) {
    params.set('entityId', entityId.trim());
  }

  return apiRequest<PageResponseDto<AuditLogDto>>(`/api/v1/audit-logs/entity?${params}`);
}

export function unlockUser(id: number) {
  return apiRequest<void>(`/api/v1/users/${id}/unlock`, {
    method: 'POST',
  });
}

export function fetchAuditLogActions(entityType?: string) {
  const params = new URLSearchParams();

  if (entityType) {
    params.set('entityType', entityType);
  }

  const query = params.toString();
  return apiRequest<string[]>(`/api/v1/audit-logs/actions${query ? `?${query}` : ''}`);

}


export function exportReport(type: 'sales' | 'purchase' | 'inventory', format: 'excel' | 'pdf', from?: string, to?: string, groupBy?: string) {
  const params = new URLSearchParams();
  params.set('type', type);
  params.set('format', format);
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  if (groupBy) params.set('groupBy', groupBy);

  const qs = params.toString();
  // Using a custom apiClient download function to handle the binary Blob instead of JSON parsing
  // This needs to be imported from apiClient
  return import('./apiClient').then(({ apiDownloadBlob }) =>
    apiDownloadBlob(`/api/v1/reports/export?${qs}`)
  );
}

export function exportComprehensiveReport(format: 'pdf' | 'excel' = 'pdf', from?: string, to?: string) {
  const params = new URLSearchParams();
  params.set('format', format);
  if (from) params.set('from', from);
  if (to) params.set('to', to);

  const qs = params.toString();
  return import('./apiClient').then(({ apiDownloadBlob }) =>
    apiDownloadBlob(`/api/v1/reports/comprehensive?${qs}`)
  );
}
