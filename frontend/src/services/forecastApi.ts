import { apiRequest } from '@/services/apiClient';
import type { AiStatusDto, ForecastItemDetailDto, ForecastResultDto, ReorderRecommendationDto, TrainJobDto } from '@/types/api';

export function trainForecast() {
  return apiRequest<{ jobId: string }>('/api/v1/forecast/train', { method: 'POST' });
}

export function fetchTrainJobStatus(jobId: string) {
  return apiRequest<TrainJobDto>(`/api/v1/forecast/train/status?jobId=${encodeURIComponent(jobId)}`);
}

export function runForecast() {
  return apiRequest<Record<string, unknown>>('/api/v1/forecast/run', { method: 'POST' });
}

export function fetchForecastResults() {
  return apiRequest<ForecastResultDto[]>('/api/v1/forecast/results');
}

export function fetchForecastItemDetail(itemId: number) {
  return apiRequest<ForecastItemDetailDto>(`/api/v1/forecast/results/${itemId}`);
}

export function fetchReorderRecommendations() {
  return apiRequest<ReorderRecommendationDto[]>('/api/v1/forecast/recommendations');
}

export function fetchAiStatus() {
  return apiRequest<AiStatusDto>('/api/v1/forecast/ai-status');
}
