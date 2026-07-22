import { apiRequest } from '@/services/apiClient';
import type { PromotionDto, PromotionRecommendationDto, PromotionValidateDto } from '@/types/api';

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
  maxUsage?: number | null;
  maxPerCustomer?: number | null;
  stackable?: boolean;
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

export function validatePromotion(code: string, orderSubtotal: number, customerId?: number) {
  return apiRequest<PromotionValidateDto>('/api/v1/promotions/validate', {
    method: 'POST',
    body: JSON.stringify({ code, orderSubtotal, customerId }),
  });
}

export function fetchPromotionRecommendations(pendingOnly = false) {
  const qs = pendingOnly ? '?pendingOnly=true' : '';
  return apiRequest<PromotionRecommendationDto[]>(`/api/v1/promotions/recommendations${qs}`);
}

export function approvePromotionRecommendation(id: number) {
  return apiRequest<PromotionRecommendationDto>(`/api/v1/promotions/recommendations/${id}/approve`, { method: 'POST' });
}

export function rejectPromotionRecommendation(id: number) {
  return apiRequest<PromotionRecommendationDto>(`/api/v1/promotions/recommendations/${id}/reject`, { method: 'POST' });
}
