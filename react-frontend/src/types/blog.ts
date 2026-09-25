export type BlogCategory = 'study-advice' | 'platform-journal' | 'legal-learning';

export interface BlogSection {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
}

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  category: BlogCategory;
  author: string;
  publishedAt: string;
  updatedAt: string;
  readingMinutes: number;
  tags: string[];
  sections: BlogSection[];
  sources: string[];
  status: 'published';
}

export interface BlogListResponse {
  posts: BlogPost[];
  total: number;
  page: number;
  limit: number;
}

export interface BlogDetailResponse {
  post: BlogPost;
}
