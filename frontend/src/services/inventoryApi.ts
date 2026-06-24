import { apiRequest } from '@/services/apiClient';
import type {
  InventoryAlertDto,
  InventoryItemDto,
  InventoryLogDto,
  PageResponseDto,
  ReturnOrderDto,
  ScrapOrderDto,
  StocktakeDto,
  TransferOrderDto,
} from '@/types/api';

export function fetchInventoryAlerts() {
  return apiRequest<InventoryAlertDto[]>('/api/v1/inventory-alerts');
}

export function resolveInventoryAlert(id: number) {
  return apiRequest<InventoryAlertDto>(`/api/v1/inventory-alerts/${id}/resolve`, { method: 'PATCH' });
}

export function fetchInventory() {
  return apiRequest<InventoryItemDto[]>('/api/v1/inventory');
}

export function fetchInventorySummary() {
  return apiRequest<{
    inventoryRows: number;
    totalQuantity: number;
    totalReserved: number;
    totalAvailable: number;
    lowStockRows: number;
    outOfStockRows: number;
    nearExpiryRows: number;
  }>('/api/v1/inventory/summary');
}

export function fetchNearExpiry() {
  return apiRequest<InventoryItemDto[]>('/api/v1/inventory/near-expiry');
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

export function fetchScrapOrders(status?: string) {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  const qs = params.toString() ? `?${params.toString()}` : '';
  return apiRequest<ScrapOrderDto[]>(`/api/v1/scrap-orders${qs}`);
}

export function fetchScrapOrderById(id: number) {
  return apiRequest<ScrapOrderDto>(`/api/v1/scrap-orders/${id}`);
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
  const params = new URLSearchParams({ reason });
  return apiRequest<unknown>(`/api/v1/scrap-orders/${id}/cancel?${params}`, { method: 'POST' });
}

export function fetchStocktakes(status?: string) {
  const qs = status ? `?status=${status}` : '';
  return apiRequest<StocktakeDto[]>(`/api/v1/stocktakes${qs}`);
}

export function fetchStocktakeById(id: number) {
  return apiRequest<StocktakeDto>(`/api/v1/stocktakes/${id}`);
}

export function createStocktake(payload: {
  locationId: number;
  note?: string;
  items: { itemId: number; lotId?: number; actualQuantity?: number; note?: string }[];
}) {
  return apiRequest<StocktakeDto>('/api/v1/stocktakes', { method: 'POST', body: JSON.stringify(payload) });
}

export function confirmStocktake(id: number, items?: { itemId: number; lotId?: number; actualQuantity: number }[]) {
  return apiRequest<StocktakeDto>(`/api/v1/stocktakes/${id}/confirm`, {
    method: 'POST',
    body: JSON.stringify(items && items.length > 0 ? { items } : {}),
  });
}

export function cancelStocktake(id: number) {
  return apiRequest<StocktakeDto>(`/api/v1/stocktakes/${id}/cancel`, { method: 'POST' });
}

export function fetchTransferOrders(status?: string) {
  const qs = status ? `?status=${status}` : '';
  return apiRequest<TransferOrderDto[]>(`/api/v1/transfer-orders${qs}`);
}

export function fetchTransferOrderById(id: number) {
  return apiRequest<TransferOrderDto>(`/api/v1/transfer-orders/${id}`);
}

export function createTransferOrder(payload: {
  fromLocationId: number;
  toLocationId: number;
  note?: string;
  items: { itemId: number; lotId?: number; quantity: number; note?: string }[];
}) {
  return apiRequest<TransferOrderDto>('/api/v1/transfer-orders', { method: 'POST', body: JSON.stringify(payload) });
}

export function completeTransferOrder(id: number) {
  return apiRequest<TransferOrderDto>(`/api/v1/transfer-orders/${id}/complete`, { method: 'POST' });
}

export function cancelTransferOrder(id: number) {
  return apiRequest<TransferOrderDto>(`/api/v1/transfer-orders/${id}/cancel`, { method: 'POST' });
}

export function fetchReturnOrders() {
  return apiRequest<ReturnOrderDto[]>('/api/v1/return-orders');
}

export function createReturnOrder(payload: {
  originalOrderId: number;
  reason?: string;
  note?: string;
  items: { itemId: number; lotId?: number; quantity: number }[];
}) {
  return apiRequest<ReturnOrderDto>('/api/v1/return-orders', { method: 'POST', body: JSON.stringify(payload) });
}
