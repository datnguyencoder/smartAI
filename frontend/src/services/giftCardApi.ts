import { apiRequest } from '@/services/apiClient';
import type { GiftCardDto } from '@/types/api';

export function fetchGiftCards() {
  return apiRequest<GiftCardDto[]>('/api/v1/gift-cards');
}

export function issueGiftCard(payload: { initialBalance: number; expiresAt?: string; note?: string }) {
  return apiRequest<GiftCardDto>('/api/v1/gift-cards', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function redeemGiftCard(payload: { cardCode: string; amount: number }) {
  return apiRequest<GiftCardDto>('/api/v1/gift-cards/redeem', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function fetchGiftCardBalance(cardCode: string) {
  return apiRequest<GiftCardDto>(`/api/v1/gift-cards/balance/${encodeURIComponent(cardCode)}`);
}
