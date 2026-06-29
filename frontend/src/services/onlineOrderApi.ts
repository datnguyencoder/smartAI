import { apiRequest } from '@/services/apiClient';
import type { OnlineOrderRequestDto } from '@/types/api';

export function fetchOnlineOrders() {
  return apiRequest<OnlineOrderRequestDto[]>('/api/v1/online-orders');
}

export function fetchOnlineOrder(id: number) {
  return apiRequest<OnlineOrderRequestDto>(`/api/v1/online-orders/${id}`);
}

export function createOnlineOrder(payload: {
  customerName?: string;
  customerPhone?: string;
  deliveryAddress?: string;
  totalAmount?: number;
  note?: string;
}) {
  return apiRequest<OnlineOrderRequestDto>('/api/v1/online-orders', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateOnlineOrderStatus(id: number, status: string) {
  return apiRequest<OnlineOrderRequestDto>(`/api/v1/online-orders/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}
