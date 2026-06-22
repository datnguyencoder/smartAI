import { apiRequest } from '@/services/apiClient';

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

export function aiSuggestPromotion(itemId: number) {
  return apiRequest<{ suggestion: string; promotionId: number; discountPercent: number; status: string; source?: string }>(
    `/api/v1/ai-insight/suggest-promotion/${itemId}`,
    { method: 'POST' }
  );
}
