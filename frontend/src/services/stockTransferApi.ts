import { apiRequest } from '@/services/apiClient';
import type { StockTransferOrderDto } from '@/types/api';

export function fetchStockTransferOrders() {
  return apiRequest<StockTransferOrderDto[]>('/api/v1/stock-transfers');
}

export function fetchStockTransferOrder(id: number) {
  return apiRequest<StockTransferOrderDto>(`/api/v1/stock-transfers/${id}`);
}

export function createStockTransferOrder(payload: {
  fromLocationId: number;
  toLocationId: number;
  note?: string;
  items: { itemId: number; lotId?: number; quantity: number }[];
}) {
  return apiRequest<StockTransferOrderDto>('/api/v1/stock-transfers', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function confirmStockTransferOrder(id: number) {
  return apiRequest<StockTransferOrderDto>(`/api/v1/stock-transfers/${id}/confirm`, { method: 'POST' });
}

export function cancelStockTransferOrder(id: number) {
  return apiRequest<StockTransferOrderDto>(`/api/v1/stock-transfers/${id}/cancel`, { method: 'POST' });
}
