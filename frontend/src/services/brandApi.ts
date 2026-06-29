import { apiRequest } from '@/services/apiClient';
import type { BrandDto } from '@/types/api';

export function fetchBrands() {
  return apiRequest<BrandDto[]>('/api/v1/brands');
}

export function fetchBrand(id: number) {
  return apiRequest<BrandDto>(`/api/v1/brands/${id}`);
}

export function createBrand(payload: { brandName: string; description?: string }) {
  return apiRequest<BrandDto>('/api/v1/brands', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateBrand(id: number, payload: { brandName?: string; description?: string; active?: boolean }) {
  return apiRequest<BrandDto>(`/api/v1/brands/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}
