import { ApiClientError, apiRequest } from '@/services/apiClient';
import type { CustomerDto, OrderDto, OrderPrintDto, PageResponseDto } from '@/types/api';

export function createOrder(payload: {
  customerName?: string;
  customerPhone?: string;
  promotionCode?: string;
  paymentMethod?: string;
  loyaltyPointsRedeemed?: number;
  payments?: { paymentMethod: string; amount: number }[];
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
  } catch (e: unknown) {
    if (e instanceof ApiClientError && e.status === 403) return [] as OrderDto[];
    throw e;
  }
}

export function fetchOrdersPaged(page = 0, size = 10, search?: string, status?: string, fromDate?: string, toDate?: string) {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  if (search) params.set('search', search);
  if (status && status !== 'ALL') params.set('status', status);
  if (fromDate) params.set('fromDate', fromDate);
  if (toDate) params.set('toDate', toDate);
  return apiRequest<PageResponseDto<OrderDto>>(`/api/v1/orders/paged?${params}`);
}

export function fetchOrderById(orderId: number) {
  return apiRequest<OrderDto>(`/api/v1/orders/${orderId}`);
}

export function fetchOrderPrint(orderId: number) {
  return apiRequest<OrderPrintDto>(`/api/v1/orders/${orderId}/print`);
}

export function cancelOrder(orderId: number) {
  return apiRequest<OrderDto>(`/api/v1/orders/${orderId}/cancel`, { method: 'POST' });
}

export function suggestCustomers(keyword: string) {
  return apiRequest<string[]>(`/api/v1/orders/customers/suggest?q=${encodeURIComponent(keyword)}`);
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
