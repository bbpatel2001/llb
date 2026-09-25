import { Router, Request, Response } from 'express';
import { blogPosts, BlogPostRecord } from '../data/blogs';

const router = Router();

function boundedNumber(value: unknown, fallback: number, maximum: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? Math.min(parsed, maximum) : fallback;
}

function matchesSearch(post: BlogPostRecord, search: string): boolean {
  const haystack = [
    post.title,
    post.excerpt,
    post.category,
    post.author,
    ...post.tags,
    ...post.sections.flatMap((section) => [section.heading, ...section.paragraphs, ...(section.bullets || [])]),
  ].join(' ').toLowerCase();
  return haystack.includes(search.toLowerCase());
}

router.get('/', (req: Request, res: Response) => {
  const search = typeof req.query.search === 'string' ? req.query.search.trim().slice(0, 120) : '';
  const category = typeof req.query.category === 'string' ? req.query.category.trim().slice(0, 60) : '';
  const skip = boundedNumber(req.query.skip, 0, 1000);
  const limit = Math.max(1, boundedNumber(req.query.limit, 12, 50));
  const filtered = blogPosts
    .filter((post) => post.status === 'published')
    .filter((post) => !search || matchesSearch(post, search))
    .filter((post) => !category || post.category === category)
    .sort((left, right) => right.publishedAt.localeCompare(left.publishedAt));
  const posts = filtered.slice(skip, skip + limit);
  return res.json({ posts, total: filtered.length, page: Math.floor(skip / limit) + 1, limit });
});

router.get('/:slug', (req: Request, res: Response) => {
  const post = blogPosts.find((candidate) => candidate.slug === req.params.slug && candidate.status === 'published');
  if (!post) return res.status(404).json({ error: 'Blog post not found' });
  return res.json({ post });
});

export default router;
