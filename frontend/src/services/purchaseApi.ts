import { apiRequest } from '@/services/apiClient';
import type { PageResponseDto, PurchaseOrderDto, PurchaseReturnDto, SupplierDebtDto } from '@/types/api';

export function createPurchaseOrder(payload: {
  supplierId: number;
  locationId: number;
  paymentDeferred?: boolean;
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
  return apiRequest<PurchaseOrderDto>(`/api/v1/purchase-orders/${purchaseId}/receive`, { method: 'POST' });
}

export function receivePurchaseOrderPartial(purchaseId: number, items: { purchaseOrderItemId: number; quantity: number }[]) {
  return apiRequest<PurchaseOrderDto>(`/api/v1/purchase-orders/${purchaseId}/receive-partial`, {
    method: 'POST',
    body: JSON.stringify({ items }),
  });
}

export function cancelPurchaseOrder(purchaseId: number) {
  return apiRequest<PurchaseOrderDto>(`/api/v1/purchase-orders/${purchaseId}/cancel`, { method: 'POST' });
}

export function finalizeShortPurchaseOrder(purchaseId: number, reason?: string) {
  return apiRequest<PurchaseOrderDto>(`/api/v1/purchase-orders/${purchaseId}/finalize-short`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

export async function fetchPurchaseOrders() {
  const result = await apiRequest<PageResponseDto<PurchaseOrderDto>>('/api/v1/purchase-orders?page=0&size=200&sort=id,desc');
  return result.content;
}

export function fetchPurchaseOrderById(purchaseId: number) {
  return apiRequest<PurchaseOrderDto>(`/api/v1/purchase-orders/${purchaseId}`);
}

export function fetchSupplierDebts(status?: string) {
  const qs = status ? `?status=${status}` : '';
  return apiRequest<SupplierDebtDto[]>(`/api/v1/supplier-debts${qs}`);
}

export function fetchSupplierDebtsBySupplier(supplierId: number) {
  return apiRequest<SupplierDebtDto[]>(`/api/v1/supplier-debts/supplier/${supplierId}`);
}

export function recordDebtPayment(debtId: number, payload: { amount: number; paymentMethod?: string; note?: string }) {
  return apiRequest<SupplierDebtDto>(`/api/v1/supplier-debts/${debtId}/payments`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function fetchPurchaseReturns() {
  return apiRequest<PurchaseReturnDto[]>('/api/v1/purchase-returns');
}

export function createPurchaseReturn(payload: {
  supplierId: number;
  locationId: number;
  purchaseOrderId?: number;
  note?: string;
  items: { itemId: number; lotId?: number; quantity: number; unitPrice: number }[];
}) {
  return apiRequest<PurchaseReturnDto>('/api/v1/purchase-returns', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
