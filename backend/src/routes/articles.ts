import { Router, Request, Response } from 'express';
import { articles, ArticleRecord } from '../data/articles';

const router = Router();

function boundedNumber(value: unknown, fallback: number, maximum: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? Math.min(parsed, maximum) : fallback;
}

function matchesSearch(article: ArticleRecord, search: string): boolean {
  const haystack = [
    article.title,
    article.excerpt,
    article.subject,
    article.chapter,
    article.topic,
    ...article.concepts,
    ...article.learningObjectives,
    article.category,
    ...article.tags,
    ...article.sections.flatMap((section) => [section.heading, ...section.paragraphs, ...(section.bullets || [])]),
  ].join(' ').toLowerCase();
  return haystack.includes(search.toLowerCase());
}

router.get('/', (req: Request, res: Response) => {
  const search = typeof req.query.search === 'string' ? req.query.search.trim().slice(0, 120) : '';
  const category = typeof req.query.category === 'string' ? req.query.category.trim().slice(0, 60) : '';
  const subject = typeof req.query.subject === 'string' ? req.query.subject.trim().slice(0, 160) : '';
  const skip = boundedNumber(req.query.skip, 0, 1000);
  const limit = Math.max(1, boundedNumber(req.query.limit, 12, 50));
  const filtered = articles
    .filter((article) => article.status === 'published')
    .filter((article) => !search || matchesSearch(article, search))
    .filter((article) => !category || article.category === category)
    .filter((article) => !subject || article.subject.toLowerCase() === subject.toLowerCase())
    .sort((left, right) => right.publishedAt.localeCompare(left.publishedAt));
  const pageArticles = filtered.slice(skip, skip + limit);
  return res.json({ articles: pageArticles, total: filtered.length, page: Math.floor(skip / limit) + 1, limit });
});

router.get('/:slug', (req: Request, res: Response) => {
  const article = articles.find((candidate) => candidate.slug === req.params.slug && candidate.status === 'published');
  if (!article) return res.status(404).json({ error: 'Article not found' });
  return res.json({ article });
});

export default router;
