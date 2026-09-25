export type ArticleCategory = 'subject-guide' | 'case-law' | 'exam-skills' | 'legal-research';

export interface ArticleSection {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
}

export interface ArticleLink {
  label: string;
  href: string;
}

export interface Article {
  slug: string;
  title: string;
  excerpt: string;
  category: ArticleCategory;
  subject: string;
  semester: number;
  chapter: string;
  topic: string;
  concepts: string[];
  learningObjectives: string[];
  readingMinutes: number;
  publishedAt: string;
  updatedAt: string;
  tags: string[];
  sections: ArticleSection[];
  keyTakeaways: string[];
  sources: string[];
  relatedLinks: ArticleLink[];
  status: 'published';
}

export interface ArticleListResponse {
  articles: Article[];
  total: number;
  page: number;
  limit: number;
}

export interface ArticleDetailResponse {
  article: Article;
}
