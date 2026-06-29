import { apiRequest } from '@/services/apiClient';
import type { OrderDto, QuotationDto } from '@/types/api';

export function fetchQuotations() {
  return apiRequest<QuotationDto[]>('/api/v1/quotations');
}

export function fetchQuotation(id: number) {
  return apiRequest<QuotationDto>(`/api/v1/quotations/${id}`);
}

export function createQuotation(payload: {
  customerName?: string;
  customerPhone?: string;
  validUntil?: string;
  note?: string;
  items: { itemId: number; quantity: number; unitPrice: number }[];
}) {
  return apiRequest<QuotationDto>('/api/v1/quotations', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function convertQuotationToOrder(id: number) {
  return apiRequest<OrderDto>(`/api/v1/quotations/${id}/convert`, { method: 'POST' });
}
