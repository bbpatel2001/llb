import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { Syllabus } from '../models/Syllabus';
import { Question } from '../models/Question';

const router = Router();

// Build the pattern with actual code points. A JavaScript regex literal keeps
// \\u escapes in BSON, which MongoDB's PCRE2 engine rejects.
const unreadableQuestionPattern = `[${String.fromCodePoint(0xe000)}-${String.fromCodePoint(0xf8ff)}${String.fromCodePoint(0xfffd)}]`;
const readableQuestionFilter = {
  reviewStatus: 'published',
  $and: [
    { questionText: { $not: { $regex: unreadableQuestionPattern } } },
    { questionText: { $regex: '\\p{L}' } },
  ],
};

function boundedNumber(value: unknown, fallback: number, maximum: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? Math.min(parsed, maximum) : fallback;
}

router.get('/', async (req: Request, res: Response) => {
  try {
    const query: Record<string, unknown> = { status: 'published' };
    if (req.query.university) query.university = String(req.query.university).slice(0, 120);
    if (req.query.programme) query.programme = String(req.query.programme).slice(0, 200);
    if (req.query.academicYear) query.academicYear = String(req.query.academicYear).slice(0, 40);
    if (req.query.semester) query.semester = Number(req.query.semester);
    if (req.query.courseCategory && ['core', 'foundation', 'elective', 'soft-skill'].includes(String(req.query.courseCategory))) query.courseCategory = String(req.query.courseCategory);
    if (req.query.subjectCode) query.subjectCode = String(req.query.subjectCode).slice(0, 50);
    if (req.query.syllabusKey) query.syllabusKey = String(req.query.syllabusKey).slice(0, 150);
    const skip = boundedNumber(req.query.skip, 0, 100000);
    const limit = Math.max(1, boundedNumber(req.query.limit, 20, 100));
    const [syllabi, total] = await Promise.all([
      Syllabus.find(query).sort({ subjectCode: 1, version: -1 }).skip(skip).limit(limit),
      Syllabus.countDocuments(query),
    ]);
    return res.json({ syllabi, total });
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/universities', async (_req: Request, res: Response) => {
  try {
    const universities = await Syllabus.aggregate<{
      _id: string;
      syllabusCount: number;
      programmes: string[];
      academicYears: string[];
      semesters: number[];
    }>([
      { $match: { status: 'published' } },
      { $sort: { syllabusKey: 1, version: -1 } },
      {
        $group: {
          _id: '$syllabusKey',
          university: { $first: '$university' },
          programme: { $first: '$programme' },
          academicYear: { $first: '$academicYear' },
          semester: { $first: '$semester' },
        },
      },
      {
        $group: {
          _id: '$university',
          syllabusCount: { $sum: 1 },
          programmes: { $addToSet: '$programme' },
          academicYears: { $addToSet: '$academicYear' },
          semesters: { $addToSet: '$semester' },
        },
      },
      { $project: { _id: 1, syllabusCount: 1, programmes: 1, academicYears: 1, semesters: 1 } },
      { $sort: { _id: 1 } },
    ]);
    return res.json({ universities: universities.map((summary) => ({
      university: summary._id,
      syllabusCount: summary.syllabusCount,
      programmes: [...summary.programmes].sort(),
      academicYears: [...summary.academicYears].sort().reverse(),
      semesters: [...summary.semesters].sort((a, b) => a - b),
    })) });
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/:syllabusId', async (req: Request, res: Response) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.syllabusId)) return res.status(400).json({ error: 'Invalid syllabus ID' });
  try {
    const syllabus = await Syllabus.findOne({ _id: req.params.syllabusId, status: 'published' });
    if (!syllabus) return res.status(404).json({ error: 'Published syllabus not found' });
    return res.json({ syllabus });
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/:syllabusId/topics', async (req: Request, res: Response) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.syllabusId)) return res.status(400).json({ error: 'Invalid syllabus ID' });
  try {
    const syllabus = await Syllabus.findOne({ _id: req.params.syllabusId, status: 'published' }).lean();
    if (!syllabus) return res.status(404).json({ error: 'Published syllabus not found' });
    const parentTopicKey = req.query.parentTopicKey ? String(req.query.parentTopicKey) : undefined;
    const topics = parentTopicKey === undefined
      ? syllabus.topics
      : syllabus.topics.filter((topic) => topic.parentTopicKey === parentTopicKey);
    return res.json({ topics });
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/:syllabusId/topics/:topicKey/questions', async (req: Request, res: Response) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.syllabusId)) return res.status(400).json({ error: 'Invalid syllabus ID' });
  try {
    const syllabus = await Syllabus.findOne({ _id: req.params.syllabusId, status: 'published' }).select('_id version').lean();
    if (!syllabus) return res.status(404).json({ error: 'Published syllabus not found' });
    const skip = boundedNumber(req.query.skip, 0, 100000);
    const limit = Math.max(1, boundedNumber(req.query.limit, 50, 100));
    const topicKey = String(req.params.topicKey).slice(0, 120);
    const mapping = { syllabusId: syllabus._id, syllabusVersion: syllabus.version, topicKey };
    const query = { topicRefs: { $elemMatch: mapping }, ...readableQuestionFilter };
    const [questions, total] = await Promise.all([
      Question.find(query).select('-correctAnswer').sort({ semester: 1, subject: 1, questionNumber: 1 }).skip(skip).limit(limit),
      Question.countDocuments(query),
    ]);
    return res.json({ questions, total, topicKey });
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
