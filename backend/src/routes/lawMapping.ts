import { Router, Request, Response } from 'express';
import { lawMappings, LawMappingRecord } from '../data/lawMappings';

const router = Router();

function boundedNumber(value: unknown, fallback: number, maximum: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? Math.min(parsed, maximum) : fallback;
}

function matchesSearch(mapping: LawMappingRecord, search: string): boolean {
  const haystack = [
    mapping.title,
    mapping.summary,
    mapping.subject,
    mapping.actName,
    ...mapping.tags,
    ...mapping.principles,
    ...mapping.syllabusTopics,
    ...mapping.provisions.map((provision) => `${provision.number} ${provision.title} ${provision.summary}`),
    ...mapping.caseLaws.map((caseLaw) => `${caseLaw.name} ${caseLaw.citation} ${caseLaw.principle}`),
  ].join(' ').toLowerCase();
  return haystack.includes(search.toLowerCase());
}

router.get('/', (req: Request, res: Response) => {
  const search = typeof req.query.search === 'string' ? req.query.search.trim().slice(0, 120) : '';
  const subject = typeof req.query.subject === 'string' ? req.query.subject.trim().slice(0, 160) : '';
  const semester = req.query.semester ? Number(req.query.semester) : undefined;
  const skip = boundedNumber(req.query.skip, 0, 1000);
  const limit = Math.max(1, boundedNumber(req.query.limit, 12, 50));

  const filtered = lawMappings.filter((mapping) => (
    mapping.status === 'published'
    && (!search || matchesSearch(mapping, search))
    && (!subject || mapping.subject.toLowerCase() === subject.toLowerCase())
    && (!semester || mapping.semester === semester)
  ));
  const mappings = filtered.slice(skip, skip + limit);

  return res.json({ mappings, total: filtered.length, page: Math.floor(skip / limit) + 1, limit });
});

router.get('/:slug', (req: Request, res: Response) => {
  const mapping = lawMappings.find((candidate) => candidate.slug === req.params.slug && candidate.status === 'published');
  if (!mapping) return res.status(404).json({ error: 'Law mapping not found' });
  return res.json({ mapping });
});

export default router;
