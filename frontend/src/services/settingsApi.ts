import { apiRequest } from '@/services/apiClient';
import type { SettingDto } from '@/types/api';

export function fetchSettings() {
  return apiRequest<SettingDto[]>('/api/v1/settings');
}

export function updateSetting(key: string, value: string, description?: string) {
  return apiRequest<SettingDto>(`/api/v1/settings/${encodeURIComponent(key)}`, {
    method: 'PUT',
    body: JSON.stringify({ value, description }),
  });
}
