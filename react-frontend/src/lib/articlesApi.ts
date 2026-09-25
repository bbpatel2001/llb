import api from './api';
import { ArticleDetailResponse, ArticleListResponse } from '@/types/article';

export const articlesApi = {
  getAll: (params: { search?: string; category?: string; subject?: string; skip?: number; limit?: number } = {}) =>
    api.get<ArticleListResponse>('/api/articles', { params }),
  getBySlug: (slug: string) => api.get<ArticleDetailResponse>(`/api/articles/${encodeURIComponent(slug)}`),
};
