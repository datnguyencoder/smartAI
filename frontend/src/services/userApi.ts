import { apiRequest } from '@/services/apiClient';
import type { CreateUserPayload, UpdateUserPayload, UserDto } from '@/types/api';

export function fetchUsers() {
  return apiRequest<UserDto[]>('/api/v1/users');
}

export function createUser(payload: CreateUserPayload) {
  return apiRequest<UserDto>('/api/v1/users', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateUser(id: number, payload: UpdateUserPayload) {
  return apiRequest<UserDto>(`/api/v1/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function lockUser(id: number) {
  return apiRequest<void>(`/api/v1/users/${id}/lock`, { method: 'POST' });
}

export function unlockUser(id: number) {
  return apiRequest<void>(`/api/v1/users/${id}/unlock`, { method: 'POST' });
}

export function softDeleteUser(id: number) {
  return apiRequest<void>(`/api/v1/users/${id}`, { method: 'DELETE' });
}
