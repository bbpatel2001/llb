import api from './api';
import { BlogDetailResponse, BlogListResponse } from '@/types/blog';

export const blogsApi = {
  getAll: (params: { search?: string; category?: string; skip?: number; limit?: number } = {}) =>
    api.get<BlogListResponse>('/api/blogs', { params }),
  getBySlug: (slug: string) => api.get<BlogDetailResponse>(`/api/blogs/${encodeURIComponent(slug)}`),
};
