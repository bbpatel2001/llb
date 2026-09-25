import api from './api';
import { LawMappingDetailResponse, LawMappingListResponse } from '@/types/lawMapping';

export const lawMappingsApi = {
  getAll: (params: { search?: string; subject?: string; semester?: number; skip?: number; limit?: number } = {}) =>
    api.get<LawMappingListResponse>('/api/law-mappings', { params }),
  getBySlug: (slug: string) => api.get<LawMappingDetailResponse>(`/api/law-mappings/${encodeURIComponent(slug)}`),
};
