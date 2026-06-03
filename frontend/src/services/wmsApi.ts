import { apiRequest } from './apiClient';
import type {
  AuthDto,
  CategoryDto,
  ItemDto,
  LocationDto,
  OrderDto,
  PurchaseOrderDto,
  SupplierDto,
  UomDto,
} from '../types/api';

export function login(username: string, password: string) {
  return apiRequest<AuthDto>(
    '/api/v1/auth/login',
    { method: 'POST', body: JSON.stringify({ username, password }) },
    false
  );
}

export function fetchItems(search?: string) {
  const q = search ? `?q=${encodeURIComponent(search)}` : '';
  return apiRequest<ItemDto[]>(`/api/v1/items${q}`);
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
}) {
  return apiRequest<ItemDto>('/api/v1/items', {
    method: 'POST',
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
  return apiRequest<unknown[]>('/api/v1/inventory');
}

export function fetchNearExpiry() {
  return apiRequest<unknown[]>('/api/v1/inventory/near-expiry');
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
  return apiRequest<Record<string, unknown>>('/api/v1/dashboard/summary');
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
