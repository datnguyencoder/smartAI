import { apiRequest } from './apiClient';
import type {
  AuthDto,
  CategoryDto,
  DashboardSummaryDto,
  InventoryAlertDto,
  InventoryItemDto,
  ItemDto,
  LocationDto,
  OrderDto,
  PageResponseDto,
  PurchaseOrderDto,
  SupplierDto,
  UomDto,
  UserDto,
  CreateUserPayload,
  UpdateUserPayload,
} from '../types/api';

export function login(username: string, password: string) {
  return apiRequest<AuthDto>(
    '/api/v1/auth/login',
    { method: 'POST', body: JSON.stringify({ username, password }) },
    false
  );
}

export function logout() {
  return apiRequest<void>('/api/v1/auth/logout', { method: 'POST' });
}

export function fetchMe() {
  return apiRequest<UserDto>('/api/v1/auth/me');
}

export function refreshAuth(refreshToken: string) {
  return apiRequest<AuthDto>('/api/v1/auth/refresh', { method: 'POST', body: JSON.stringify({ refreshToken }) }, false);
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

export function updateUser(id: string, payload: UpdateUserPayload) {
  return apiRequest<UserDto>(`/api/v1/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function lockUser(id: string) {
  return apiRequest<void>(`/api/v1/users/${id}/deactivate`, {
    method: 'POST',
  });
}

export function softDeleteUser(id: string) {
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

export function fetchItems(search?: string) {
  const q = search ? `?q=${encodeURIComponent(search)}` : '';
  return apiRequest<ItemDto[]>(`/api/v1/items${q}`);
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
  paymentMethod?: string;
  items: { itemId: number; quantity: number }[];
}) {
  return apiRequest<OrderDto>('/api/v1/orders', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function fetchOrders() {
  return apiRequest<OrderDto[]>('/api/v1/orders');
}

export function fetchCategories() {
  return apiRequest<CategoryDto[]>('/api/v1/categories');
}

export function fetchSuppliers() {
  return apiRequest<SupplierDto[]>('/api/v1/suppliers');
}

export function fetchLocations() {
  return apiRequest<LocationDto[]>('/api/v1/locations');
}

export function fetchUoms() {
  return apiRequest<UomDto[]>('/api/v1/uoms');
}

export function createPurchaseOrder(payload: {
  supplierId: number;
  locationId: number;
  items: { itemId: number; orderedQty: number; unitPrice: number }[];
}) {
  return apiRequest<PurchaseOrderDto>('/api/v1/purchase-orders', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function fetchPurchaseOrders() {
  return apiRequest<PurchaseOrderDto[]>('/api/v1/purchase-orders');
}

export function receivePurchaseOrder(
  purchaseId: number,
  lines: { purchaseItemId: number; receiveQty: number; lotNumber?: string; expiryDate?: string }[]
) {
  return apiRequest<PurchaseOrderDto>(`/api/v1/purchase-orders/${purchaseId}/receive`, {
    method: 'POST',
    body: JSON.stringify({ lines }),
  });
}

export function cancelOrder(orderId: number) {
  return apiRequest<OrderDto>(`/api/v1/orders/${orderId}/cancel`, { method: 'POST' });
}

export function cancelPurchaseOrder(purchaseId: number) {
  return apiRequest<PurchaseOrderDto>(`/api/v1/purchase-orders/${purchaseId}/cancel`, { method: 'POST' });
}

export function fetchInventory() {
  return apiRequest<InventoryItemDto[]>('/api/v1/inventory');
}

export function fetchNearExpiry() {
  return apiRequest<InventoryItemDto[]>('/api/v1/inventory/near-expiry');
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

export function completeScrapOrder(id: number) {
  return apiRequest<unknown>(`/api/v1/scrap-orders/${id}/complete`, { method: 'POST' });
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
  return apiRequest<Record<string, unknown>[]>('/api/v1/forecast/results');
}

export function fetchReorderRecommendations() {
  return apiRequest<Record<string, unknown>[]>('/api/v1/forecast/recommendations');
}

export function aiChat(message: string) {
  return apiRequest<string>('/api/v1/ai-insight/chat', {
    method: 'POST',
    body: JSON.stringify({ message }),
  });
}
