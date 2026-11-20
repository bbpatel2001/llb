import { createHash } from 'node:crypto';
import express, { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { authenticate, requireRole } from '../middleware/auth';
import { ImportBatch } from '../models/ImportBatch';
import { StagedQuestion } from '../models/StagedQuestion';
import { Paper } from '../models/Paper';
import { Question } from '../models/Question';
import { AuditLog } from '../models/AuditLog';
import { Syllabus } from '../models/Syllabus';
import { Answer } from '../models/Answer';
import { FlashcardDeck } from '../models/Flashcard';
import { Timeline } from '../models/Timeline';
import { CaseLaw } from '../models/CaseLaw';
import { User } from '../models/User';
import { ContentGenerationService } from '../services/contentGenerationService';
import { auditPrivilegedMutation } from '../middleware/security';

const router = Router();
router.use(authenticate, requireRole('admin'), auditPrivilegedMutation);

const QUESTION_TYPES = new Set(['SHORT', 'LONG', 'MCQ', 'CASE_STUDY', 'DESCRIPTIVE']);
const DIFFICULTIES = new Set(['EASY', 'MEDIUM', 'HARD']);

function textFrom(record: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    if (typeof record[key] === 'string' && record[key].trim()) return record[key].trim();
  }
  return undefined;
}

function numberFrom(record: Record<string, unknown>, keys: string[]): number | undefined {
  for (const key of keys) {
    const value = typeof record[key] === 'number' ? record[key] : Number(record[key]);
    if (Number.isFinite(value)) return value;
  }
  return undefined;
}

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/\s+/g, ' ').replace(/[^\p{L}\p{N}\s]/gu, '').trim();
}

function fingerprint(value: string): string {
  return createHash('sha256').update(normalizeText(value)).digest('hex');
}

function relativeSourcePath(value: unknown): string | undefined {
  if (typeof value !== 'string' || !value.trim()) return undefined;
  const normalized = value.trim().replace(/\\/g, '/');
  if (normalized.startsWith('/') || /^[A-Za-z]:\//.test(normalized) || normalized.split('/').includes('..')) {
    throw new Error('sourcePath must be a repository-relative path');
  }
  return normalized;
}

function validateBatchInput(body: Record<string, unknown>) {
  const metadata = (body.metadata || {}) as Record<string, unknown>;
  const semester = numberFrom(metadata, ['semester']);
  const year = numberFrom(metadata, ['year']);
  const subject = textFrom(metadata, ['subject']);
  const title = textFrom(metadata, ['title']);
  const university = textFrom(metadata, ['university']);
  const sourceFileName = textFrom(body, ['sourceFileName']);
  const sourceSha256 = textFrom(body, ['sourceSha256']);
  const sourceType = textFrom(body, ['sourceType']) || 'json';

  if (!semester || semester < 1 || semester > 6 || !year || year < 1900 || year > 2200 || !subject || !title || !university) {
    throw new Error('metadata must include semester (1-6), subject, title, year, and university');
  }
  if (!sourceFileName || !sourceSha256) throw new Error('sourceFileName and sourceSha256 are required');
  if (!/^[a-f0-9]{64}$/i.test(sourceSha256)) throw new Error('sourceSha256 must be a 64-character hexadecimal SHA-256 digest');
  if (!['pdf', 'json', 'reconciliation-report'].includes(sourceType)) throw new Error('Unsupported sourceType');

  return {
    sourceType: sourceType as 'pdf' | 'json' | 'reconciliation-report',
    sourceFileName,
    sourceSha256,
    sourcePath: relativeSourcePath(body.sourcePath),
    fileSize: numberFrom(body, ['fileSize']),
    pageCount: numberFrom(body, ['pageCount']),
    manifestKey: textFrom(body, ['manifestKey']),
    metadata: { semester, subject: subject.toUpperCase(), title, year, university: university.toUpperCase() },
  };
}

function stageQuestion(record: unknown, index: number) {
  const value = (record || {}) as Record<string, unknown>;
  const questionText = textFrom(value, ['questionText', 'question_text', 'question', 'text', 'prompt']);
  const questionNumber = textFrom(value, ['questionNumber', 'question_number', 'number']) || `imported-${index + 1}`;
  const marks = numberFrom(value, ['marks', 'mark', 'maximumMarks']) || 1;
  const rawType = textFrom(value, ['type'])?.toUpperCase() || 'DESCRIPTIVE';
  const rawDifficulty = textFrom(value, ['difficulty'])?.toUpperCase() || 'MEDIUM';
  const issues: string[] = [];

  if (!questionText) issues.push('missing-question-text');
  if (questionText && questionText.length < 12) issues.push('question-text-too-short');
  if (questionText && /[\uE000-\uF8FF\uFFFD]/.test(questionText)) issues.push('replacement-or-private-use-character');
  if (marks < 1 || marks > 50) issues.push('marks-out-of-schema-range');
  if (!QUESTION_TYPES.has(rawType)) issues.push('invalid-question-type');
  if (!DIFFICULTIES.has(rawDifficulty)) issues.push('invalid-difficulty');

  const options = Array.isArray(value.options)
    ? value.options.filter((option): option is { label: string; text: string } => {
        const candidate = (option || {}) as Record<string, unknown>;
        return typeof candidate.label === 'string' && typeof candidate.text === 'string';
      })
    : undefined;

  return {
    questionNumber,
    questionText: questionText || '[missing question text]',
    rawText: textFrom(value, ['rawText', 'raw_text']),
    type: (QUESTION_TYPES.has(rawType) ? rawType : 'DESCRIPTIVE') as 'SHORT' | 'LONG' | 'MCQ' | 'CASE_STUDY' | 'DESCRIPTIVE',
    marks: Math.max(1, Math.min(50, marks)),
    options,
    correctAnswer: textFrom(value, ['correctAnswer', 'correct_answer']),
    difficulty: (DIFFICULTIES.has(rawDifficulty) ? rawDifficulty : 'MEDIUM') as 'EASY' | 'MEDIUM' | 'HARD',
    tags: Array.isArray(value.tags) ? value.tags.filter((tag): tag is string => typeof tag === 'string').slice(0, 30) : [],
    sourceFingerprint: textFrom(value, ['fingerprint', 'sourceFingerprint']) || (questionText ? fingerprint(questionText) : fingerprint(`${questionNumber}-${index}`)),
    sourceLocation: {
      page: numberFrom(value, ['page', 'pageNumber']),
      span: textFrom(value, ['span', 'sourceSpan']),
    },
    extractionQuality: Math.max(0, Math.min(100, numberFrom(value, ['extractionQuality', 'quality']) ?? (issues.length ? 50 : 100))),
    validationIssues: issues,
    status: 'pending' as const,
  };
}

function boundedString(value: unknown, field: string, maxLength: number, required = false): string | undefined {
  if (typeof value !== 'string' || !value.trim()) {
    if (required) throw new Error(`${field} is required`);
    return undefined;
  }
  if (value.trim().length > maxLength) throw new Error(`${field} is too long`);
  return value.trim();
}

function stringArray(value: unknown, field: string, maxItems: number, maxLength: number): string[] {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > maxItems) throw new Error(`${field} must be an array with at most ${maxItems} items`);
  return value.map((item) => boundedString(item, field, maxLength, true) as string);
}

const MAX_SYLLABUS_PDF_BYTES = 50 * 1024 * 1024;
const MAX_EXTRACTED_SYLLABUS_CHARACTERS = 2_000_000;

type SyllabusSourceFormat = 'json' | 'pdf';

function requestHeader(req: Request, name: string): string | undefined {
  const value = req.get(name);
  return value?.trim() || undefined;
}

function parsePdfTopicCandidates(text: string): Array<Record<string, unknown>> {
  const topics: Array<Record<string, unknown>> = [];
  const seen = new Set<string>();
  const lines = text.split(/\r?\n/).map((line) => line.replace(/\s+/g, ' ').trim()).filter(Boolean);

  for (const line of lines) {
    const headingMatch = line.match(/^(?:unit|module|chapter|topic|part)\s*(?:\d+|[ivxlcdm]+)?\s*[:.)-]?\s+(.{3,300})$/i);
    const numberedMatch = line.match(/^(\d{1,3})[.)-]\s+(.{3,300})$/);
    const uppercaseMatch = line.length >= 4 && line.length <= 180 && /[A-Z]/.test(line) && line === line.toUpperCase() ? [line, line] : null;
    const name = (headingMatch?.[1] || numberedMatch?.[2] || uppercaseMatch?.[1])?.trim();
    if (!name || /^(?:contents|syllabus|course outline|semester|subject|university)\b/i.test(name)) continue;
    const normalizedName = normalizeText(name);
    if (!normalizedName || seen.has(normalizedName)) continue;
    seen.add(normalizedName);
    topics.push({ id: String(topics.length + 1), name, order: topics.length + 1 });
    if (topics.length === 200) break;
  }

  return topics;
}

function normalizeSyllabusInput(body: Record<string, unknown>) {
  const source = (body.source || {}) as Record<string, unknown>;
  if (source.format !== 'json' && source.format !== 'pdf') throw new Error('source.format must be json or pdf');
  const sourceFormat = source.format as SyllabusSourceFormat;
  const sourceFileName = boundedString(source.fileName, 'source.fileName', 200, true) as string;
  const sourceSha256 = boundedString(source.sha256, 'source.sha256', 64, true) as string;
  if (!/^[a-f0-9]{64}$/i.test(sourceSha256)) throw new Error('source.sha256 must be a 64-character hexadecimal SHA-256 digest');
  const university = boundedString(body.university, 'university', 160, true) as string;
  const subject = boundedString(body.subject, 'subject', 200, true) as string;
  const subjectCode = boundedString(body.subjectCode, 'subjectCode', 80, true) as string;
  const semester = Number(body.semester);
  if (!Number.isInteger(semester) || semester < 1 || semester > 6) throw new Error('semester must be an integer from 1 to 6');
  const topics = body.topics;
  if (!Array.isArray(topics) || topics.length === 0 || topics.length > 200) throw new Error('topics must contain between 1 and 200 top-level topics');
  const codeKey = subjectCode.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const normalizedTopics: Array<Record<string, unknown>> = [];
  const topicKeys = new Set<string>();
  topics.forEach((rawTopic, topicIndex) => {
    const topic = (rawTopic || {}) as Record<string, unknown>;
    const rawSourceId = topic.id ?? topic.sourceId;
    const sourceId = boundedString(typeof rawSourceId === 'number' ? String(rawSourceId) : rawSourceId, `topics[${topicIndex}].id`, 80, true) as string;
    const topicKey = `${codeKey}.t${sourceId.replace(/[^a-zA-Z0-9_-]/g, '-')}`;
    if (topicKeys.has(topicKey)) throw new Error(`Duplicate topic key ${topicKey}`);
    topicKeys.add(topicKey);
    const name = boundedString(topic.name, `topics[${topicIndex}].name`, 300, true) as string;
    const order = Number(topic.order ?? topicIndex + 1);
    if (!Number.isInteger(order) || order < 1 || order > 1000) throw new Error(`Invalid order for topic ${topicKey}`);
    normalizedTopics.push({
      topicKey,
      sourceId,
      name,
      order,
      description: boundedString(topic.description, 'topic.description', 2000),
      estimatedHours: topic.estimatedHours === undefined ? undefined : Math.max(0, Math.min(1000, Number(topic.estimatedHours))),
      keyTerms: stringArray(topic.keyTerms, 'topic.keyTerms', 50, 120),
      relatedSections: stringArray(topic.relatedSections, 'topic.relatedSections', 50, 160),
    });
    const subtopics = topic.subtopics;
    if (subtopics !== undefined) {
      if (!Array.isArray(subtopics) || subtopics.length > 50) throw new Error(`Invalid subtopics for topic ${topicKey}`);
      subtopics.forEach((subtopic, subIndex) => {
        const nameValue = boundedString(subtopic, `topics[${topicIndex}].subtopics`, 300, true) as string;
        const childKey = `${topicKey}.s${subIndex + 1}`;
        topicKeys.add(childKey);
        normalizedTopics.push({ topicKey: childKey, sourceId: `${sourceId}.${subIndex + 1}`, parentTopicKey: topicKey, name: nameValue, order: subIndex + 1, keyTerms: [], relatedSections: [] });
      });
    }
  });
  return {
    syllabusKey: `${university.toLowerCase().replace(/[^a-z0-9]+/g, '-')}:${semester}:${codeKey}`,
    university,
    programme: typeof body.programme === 'string' && body.programme.trim() ? body.programme.trim().slice(0, 200) : 'LL.B. Programme',
    academicYear: typeof body.academicYear === 'string' && body.academicYear.trim() ? body.academicYear.trim().slice(0, 40) : String(new Date().getFullYear()),
    semester,
    subject,
    subjectCode,
    courseCategory: ['core', 'foundation', 'elective', 'soft-skill'].includes(String(body.courseCategory)) ? body.courseCategory : 'core',
    lectureHoursPerWeek: Number.isFinite(Number(body.lectureHoursPerWeek)) ? Math.max(0, Math.min(100, Number(body.lectureHoursPerWeek))) : 0,
    otherHoursPerWeek: Number.isFinite(Number(body.otherHoursPerWeek)) ? Math.max(0, Math.min(100, Number(body.otherHoursPerWeek))) : 0,
    weeklyHours: Number.isFinite(Number(body.weeklyHours)) ? Math.max(0, Math.min(100, Number(body.weeklyHours))) : 0,
    maxMarks: Number.isFinite(Number(body.maxMarks)) ? Math.max(0, Math.min(1000, Number(body.maxMarks))) : undefined,
    credits: body.credits === undefined ? undefined : Math.max(0, Math.min(100, Number(body.credits))),
    description: boundedString(body.description, 'description', 2000),
    objectives: stringArray(body.objectives, 'objectives', 50, 500),
    outcomes: stringArray(body.outcomes, 'outcomes', 50, 500),
    topics: normalizedTopics,
    references: stringArray(body.references, 'references', 100, 500),
    assessmentPattern: body.assessmentPattern,
    source: { format: sourceFormat, fileName: sourceFileName, sha256: sourceSha256.toLowerCase() },
  };
}

router.get('/users', async (req: Request, res: Response) => {
  try {
    const skip = Math.max(0, Number(req.query.skip || 0));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 100)));
    const [users, total] = await Promise.all([
      User.find({})
        .select('name email role active verified lastLoginAt createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(),
    ]);

    return res.json({ users, total, skip, limit });
  } catch (error) {
    return res.status(500).json({ message: error instanceof Error ? error.message : 'Failed to load registered users' });
  }
});

router.patch('/users/:userId', async (req: Request, res: Response) => {
  try {
    if (req.user?.id === req.params.userId) return res.status(400).json({ message: 'You cannot modify your own administrator account here' });
    const updates: Record<string, unknown> = {};
    if (req.body.role !== undefined && ['student', 'instructor', 'admin'].includes(req.body.role)) updates.role = req.body.role;
    if (req.body.active !== undefined && typeof req.body.active === 'boolean') updates.active = req.body.active;
    if (Object.keys(updates).length === 0) return res.status(400).json({ message: 'Provide a valid role or active status' });
    const user = await User.findByIdAndUpdate(req.params.userId, { $set: updates }, { new: true, runValidators: true })
      .select('name email role active verified lastLoginAt createdAt')
      .lean();
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json({ user });
  } catch (error) {
    return res.status(500).json({ message: error instanceof Error ? error.message : 'Failed to update user' });
  }
});

router.delete('/users/:userId', async (req: Request, res: Response) => {
  try {
    if (req.user?.id === req.params.userId) return res.status(400).json({ message: 'You cannot delete your own administrator account' });
    const deleted = await User.findByIdAndDelete(req.params.userId).select('_id').lean();
    if (!deleted) return res.status(404).json({ message: 'User not found' });
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ message: error instanceof Error ? error.message : 'Failed to delete user' });
  }
});

router.get('/overview', async (_req: Request, res: Response) => {
  try {
    const unreadableQuestionPattern = new RegExp(`[${String.fromCodePoint(0xe000)}-${String.fromCodePoint(0xf8ff)}${String.fromCodePoint(0xfffd)}]`);
    const readableQuestionFilter = {
      $and: [
        { questionText: { $not: unreadableQuestionPattern } },
        { questionText: { $regex: '\\p{L}' } },
      ],
    };
    const toCountMap = (rows: Array<{ _id: string | number; count: number }>) =>
      Object.fromEntries(rows.map((row) => [String(row._id), row.count]));

    const [
      paperCount,
      questionCount,
      readableQuestionCount,
      publishedQuestionCount,
      questionsBySemester,
      questionsByType,
      answerSummary,
      flashcardDeckCount,
      timelineCount,
      caseLawCount,
      syllabusByStatus,
      importsByStatus,
      stagedQuestionsByStatus,
      draftSyllabiAwaitingApproval,
      unmappedPublishedQuestions,
      userCount,
      activeUserCount,
      usersByRole,
      recentActivity,
    ] = await Promise.all([
      Paper.countDocuments(),
      Question.countDocuments(),
      Question.countDocuments(readableQuestionFilter),
      Question.countDocuments({ reviewStatus: 'published' }),
      Question.aggregate([{ $group: { _id: '$semester', count: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
      Question.aggregate([{ $group: { _id: '$type', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
      Answer.aggregate([{ $group: { _id: null, total: { $sum: 1 }, verified: { $sum: { $cond: ['$verified', 1, 0] } }, averageQualityScore: { $avg: '$qualityScore' } } }]),
      FlashcardDeck.countDocuments(),
      Timeline.countDocuments(),
      CaseLaw.countDocuments(),
      Syllabus.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      ImportBatch.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      StagedQuestion.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Syllabus.countDocuments({ status: 'draft', importBatchId: { $exists: true } }),
      Question.countDocuments({
        reviewStatus: 'published',
        $or: [{ topicRefs: { $exists: false } }, { topicRefs: { $size: 0 } }],
      }),
      User.countDocuments(),
      User.countDocuments({ active: true }),
      User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
      AuditLog.find().populate('actorId', 'name email role').sort({ createdAt: -1 }).limit(8).lean(),
    ]);

    const summary = answerSummary[0] || { total: 0, verified: 0, averageQualityScore: null };
    return res.json({
      content: {
        papers: paperCount,
        questions: {
          total: questionCount,
          readable: readableQuestionCount,
          published: publishedQuestionCount,
          bySemester: toCountMap(questionsBySemester),
          byType: toCountMap(questionsByType),
        },
        answers: {
          total: summary.total,
          verified: summary.verified,
          averageQualityScore: summary.averageQualityScore === null ? null : Number(Number(summary.averageQualityScore).toFixed(2)),
        },
        flashcardDecks: flashcardDeckCount,
        timelines: timelineCount,
        cases: caseLawCount,
        syllabi: toCountMap(syllabusByStatus),
      },
      workflow: {
        importsByStatus: toCountMap(importsByStatus),
        stagedQuestionsByStatus: toCountMap(stagedQuestionsByStatus),
        draftSyllabiAwaitingApproval,
        unmappedPublishedQuestions,
      },
      users: {
        total: userCount,
        active: activeUserCount,
        byRole: toCountMap(usersByRole),
      },
      recentActivity,
    });
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/flashcards/deck/:deckId', async (req: Request, res: Response): Promise<any> => {
  try {
    const { limit = 200 } = req.query;
    const result = await ContentGenerationService.getFlashcardsByDeck(
      req.params.deckId,
      parseInt(limit as string)
    );

    return res.json(result);
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/audit-logs', async (req: Request, res: Response) => {
  const query: Record<string, unknown> = {};
  if (req.query.action) query.action = String(req.query.action).slice(0, 120);
  if (req.query.resourceType) query.resourceType = String(req.query.resourceType).slice(0, 80);
  if (req.query.result && ['success', 'failure'].includes(String(req.query.result))) query.result = String(req.query.result);
  if (req.query.actorId && mongoose.Types.ObjectId.isValid(String(req.query.actorId))) query.actorId = String(req.query.actorId);
  const skip = Number(req.query.skip || 0);
  const limit = Math.min(Number(req.query.limit || 50), 200);
  const [logs, total] = await Promise.all([
    AuditLog.find(query).populate('actorId', 'name email role').sort({ createdAt: -1 }).skip(skip).limit(limit),
    AuditLog.countDocuments(query),
  ]);
  return res.json({ logs, total });
});

router.get('/syllabi', async (req: Request, res: Response) => {
  const query: Record<string, unknown> = {};
  if (req.query.status) query.status = String(req.query.status);
  const syllabi = await Syllabus.find(query).sort({ syllabusKey: 1, version: -1 }).limit(100);
  return res.json({ syllabi });
});

router.get('/syllabi/:syllabusId', async (req: Request, res: Response) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.syllabusId)) return res.status(400).json({ error: 'Invalid syllabus ID' });
  const syllabus = await Syllabus.findById(req.params.syllabusId).populate('createdBy', 'name email role');
  if (!syllabus) return res.status(404).json({ error: 'Syllabus not found' });
  return res.json({ syllabus });
});

router.post('/syllabi', async (req: Request, res: Response) => {
  try {
    const normalized = normalizeSyllabusInput(req.body as Record<string, unknown>);
    const latest = await Syllabus.findOne({ syllabusKey: normalized.syllabusKey }).sort({ version: -1 }).select('version').lean();
    const importBatch = await ImportBatch.create({
      createdBy: req.user!.id,
      sourceType: 'json',
      contentType: 'syllabus',
      sourceFileName: normalized.source.fileName,
      sourceSha256: normalized.source.sha256,
      metadata: {
        semester: normalized.semester,
        subject: normalized.subject,
        title: normalized.subject,
        year: new Date().getFullYear(),
        university: normalized.university,
      },
      status: 'needs_review',
      validationSummary: { topicCount: normalized.topics.length },
      payload: normalized,
    });
    const syllabus = await Syllabus.create({ ...normalized, version: (latest?.version || 0) + 1, createdBy: req.user!.id, importBatchId: importBatch._id, status: 'draft' });
    return res.status(201).json({ syllabus });
  } catch (error) {
    if ((error as { code?: number }).code === 11000) return res.status(409).json({ error: 'This syllabus source or version already exists' });
    return res.status(400).json({ error: (error as Error).message });
  }
});

router.post('/syllabi/pdf', express.raw({ type: 'application/pdf', limit: MAX_SYLLABUS_PDF_BYTES }), async (req: Request, res: Response) => {
  try {
    // pdf-parse loads pdfjs-dist, which expects browser globals such as
    // DOMMatrix. Load it only for the PDF upload route so normal serverless
    // API requests can start in a Node runtime.
    const { PDFParse } = await import('pdf-parse');
    if (!Buffer.isBuffer(req.body) || req.body.length === 0) return res.status(400).json({ error: 'A non-empty application/pdf request body is required' });
    if (req.body.length > MAX_SYLLABUS_PDF_BYTES) return res.status(413).json({ error: 'PDF exceeds the 50 MB upload limit' });
    if (req.body.subarray(0, 5).toString('ascii') !== '%PDF-') return res.status(400).json({ error: 'The uploaded file is not a valid PDF' });

    const sourceFileName = requestHeader(req, 'x-syllabus-file-name');
    const university = requestHeader(req, 'x-syllabus-university');
    const subject = requestHeader(req, 'x-syllabus-subject');
    const subjectCode = requestHeader(req, 'x-syllabus-subject-code');
    const semester = Number(requestHeader(req, 'x-syllabus-semester'));
    const year = Number(requestHeader(req, 'x-syllabus-year') || new Date().getFullYear());
    const title = requestHeader(req, 'x-syllabus-title') || subject;
    const creditsHeader = requestHeader(req, 'x-syllabus-credits');
    const credits = creditsHeader === undefined ? undefined : Number(creditsHeader);

    if (!sourceFileName || /[\\/]/.test(sourceFileName) || sourceFileName.length > 200) return res.status(400).json({ error: 'x-syllabus-file-name must be a safe filename of at most 200 characters' });
    if (!university || !subject || !subjectCode || !title) return res.status(400).json({ error: 'x-syllabus-university, x-syllabus-subject, x-syllabus-subject-code, and x-syllabus-title are required' });
    if (!Number.isInteger(semester) || semester < 1 || semester > 6) return res.status(400).json({ error: 'x-syllabus-semester must be an integer from 1 to 6' });
    if (!Number.isInteger(year) || year < 1900 || year > 2200) return res.status(400).json({ error: 'x-syllabus-year must be an integer from 1900 to 2200' });
    if (credits !== undefined && (!Number.isFinite(credits) || credits < 0 || credits > 100)) return res.status(400).json({ error: 'x-syllabus-credits must be between 0 and 100' });

    const sourceSha256 = createHash('sha256').update(req.body).digest('hex');
    const parser = new PDFParse({ data: req.body });
    let extractedText = '';
    let pageCount = 0;
    let extractedTitle: string | undefined;
    try {
      const textResult = await parser.getText();
      extractedText = textResult.text;
      pageCount = textResult.total;
      try {
        const infoResult = await parser.getInfo();
        const pdfInfo = infoResult.info as Record<string, unknown> | undefined;
        extractedTitle = typeof pdfInfo?.Title === 'string' ? pdfInfo.Title.trim().slice(0, 300) : undefined;
      } catch {
        // PDF info metadata is optional; text extraction remains sufficient for review.
      }
    } finally {
      await parser.destroy();
    }
    if (!pageCount || pageCount < 1) return res.status(400).json({ error: 'The PDF does not contain any readable pages' });
    if (!extractedText.trim()) return res.status(400).json({ error: 'The PDF contains no extractable text; upload a text-based syllabus for review' });
    if (extractedText.length > MAX_EXTRACTED_SYLLABUS_CHARACTERS) return res.status(413).json({ error: 'Extracted PDF text exceeds the 2 million character processing limit' });

    const topics = parsePdfTopicCandidates(extractedText);
    if (topics.length === 0) return res.status(422).json({ error: 'No syllabus topic headings were recognized; add a text-based PDF with Unit, Module, Chapter, Topic, or numbered headings' });

    const normalized = normalizeSyllabusInput({
      university,
      semester,
      subject,
      subjectCode,
      credits,
      topics,
      source: { format: 'pdf', fileName: sourceFileName, sha256: sourceSha256 },
    });
    const latest = await Syllabus.findOne({ syllabusKey: normalized.syllabusKey }).sort({ version: -1 }).select('version').lean();
    const importBatch = await ImportBatch.create({
      createdBy: req.user!.id,
      sourceType: 'pdf',
      contentType: 'syllabus',
      sourceFileName,
      sourceSha256,
      fileSize: req.body.length,
      pageCount,
      metadata: { semester, subject, title, year, university },
      status: 'needs_review',
      validationSummary: {
        topicCount: normalized.topics.length,
        extractedCharacterCount: extractedText.length,
        pageCount,
        hasPdfTitle: extractedTitle ? 1 : 0,
      },
      payload: normalized,
    });
    const syllabus = await Syllabus.create({ ...normalized, version: (latest?.version || 0) + 1, createdBy: req.user!.id, importBatchId: importBatch._id, status: 'draft' });
    return res.status(201).json({ syllabus, importBatch, extraction: { pageCount, characterCount: extractedText.length, title: extractedTitle, topicCount: normalized.topics.length } });
  } catch (error) {
    if ((error as { code?: number }).code === 11000) return res.status(409).json({ error: 'An import with this PDF filename and hash already exists' });
    return res.status(400).json({ error: (error as Error).message });
  }
});

router.post('/syllabi/:syllabusId/approve', async (req: Request, res: Response) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.syllabusId)) return res.status(400).json({ error: 'Invalid syllabus ID' });
  const syllabus = await Syllabus.findById(req.params.syllabusId);
  if (!syllabus) return res.status(404).json({ error: 'Syllabus not found' });
  if (syllabus.status !== 'draft') return res.status(409).json({ error: 'Only draft syllabi can be approved' });
  if (syllabus.importBatchId) {
    const batch = await ImportBatch.findByIdAndUpdate(syllabus.importBatchId, { status: 'approved', approvedBy: req.user!.id, approvedAt: new Date() }, { new: true });
    if (!batch) return res.status(409).json({ error: 'Syllabus import batch is missing' });
  }
  return res.json({ syllabus });
});

async function publishSyllabusVersion(syllabusId: string): Promise<any> {
  const session = await mongoose.startSession();
  try {
    let publishedSyllabus: any;
    await session.withTransaction(async () => {
      const syllabus = await Syllabus.findById(syllabusId).session(session);
      if (!syllabus) throw new Error('Syllabus not found');
      if (syllabus.status !== 'draft') throw new Error('Only draft syllabi can be published');
      if (syllabus.importBatchId) {
        const batch = await ImportBatch.findById(syllabus.importBatchId).session(session);
        if (!batch || batch.status !== 'approved') throw new Error('Syllabus must be approved before publishing');
      }
      await Syllabus.updateMany({ syllabusKey: syllabus.syllabusKey, status: 'published', _id: { $ne: syllabus._id } }, { $set: { status: 'archived' } }, { session });
      syllabus.status = 'published';
      syllabus.publishedAt = new Date();
      await syllabus.save({ session });
      if (syllabus.importBatchId) await ImportBatch.updateOne({ _id: syllabus.importBatchId, status: 'approved' }, { $set: { status: 'promoted', promotedAt: new Date() } }, { session });
      publishedSyllabus = syllabus;
    });
    return publishedSyllabus;
  } catch (error) {
    const message = (error as Error).message;
    if (!/transaction.*(replica|support)|replica set|Transaction numbers are only allowed/i.test(message)) throw error;
    const syllabus = await Syllabus.findOne({ _id: syllabusId, status: 'draft' });
    if (!syllabus) throw new Error('Syllabus is no longer an unpublished draft');
    if (syllabus.importBatchId) {
      const batch = await ImportBatch.findById(syllabus.importBatchId);
      if (!batch || batch.status !== 'approved') throw new Error('Syllabus must be approved before publishing');
    }
    await Syllabus.updateMany({ syllabusKey: syllabus.syllabusKey, status: 'published', _id: { $ne: syllabus._id } }, { $set: { status: 'archived' } });
    const published = await Syllabus.findOneAndUpdate({ _id: syllabus._id, status: 'draft' }, { $set: { status: 'published', publishedAt: new Date() } }, { new: true });
    if (!published) throw new Error('Syllabus publication was changed concurrently');
    if (published.importBatchId) await ImportBatch.updateOne({ _id: published.importBatchId, status: 'approved' }, { $set: { status: 'promoted', promotedAt: new Date() } });
    return published;
  } finally {
    await session.endSession();
  }
}

router.post('/syllabi/:syllabusId/publish', async (req: Request, res: Response) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.syllabusId)) return res.status(400).json({ error: 'Invalid syllabus ID' });
  try {
    const syllabus = await publishSyllabusVersion(req.params.syllabusId);
    return res.json({ syllabus });
  } catch (error) {
    const message = (error as Error).message;
    return res.status(message === 'Syllabus not found' ? 404 : 409).json({ error: message });
  }
});

router.put('/questions/bulk-topic-mappings', async (req: Request, res: Response) => {
  const entries = req.body.mappings;
  if (!Array.isArray(entries) || entries.length === 0 || entries.length > 500) return res.status(400).json({ error: 'mappings must contain between 1 and 500 question entries' });
  const questionIds = new Set<string>();
  const normalizedEntries: Array<{ questionId: string; mappings: Array<{ syllabusId: mongoose.Types.ObjectId; syllabusVersion: number; topicKey: string }> }> = [];
  const syllabusCache = new Map<string, Set<string>>();
  for (const rawEntry of entries) {
    const entry = (rawEntry || {}) as Record<string, unknown>;
    const questionId = String(entry.questionId || '');
    if (!mongoose.Types.ObjectId.isValid(questionId) || questionIds.has(questionId)) return res.status(400).json({ error: 'Each mapping entry must contain a unique valid questionId' });
    questionIds.add(questionId);
    if (!Array.isArray(entry.mappings) || entry.mappings.length > 20) return res.status(400).json({ error: 'Each question can have at most 20 topic mappings' });
    const mappings: Array<{ syllabusId: mongoose.Types.ObjectId; syllabusVersion: number; topicKey: string }> = [];
    for (const rawMapping of entry.mappings) {
      const mapping = (rawMapping || {}) as Record<string, unknown>;
      const syllabusId = String(mapping.syllabusId || '');
      const syllabusVersion = Number(mapping.syllabusVersion);
      const topicKey = String(mapping.topicKey || '').trim();
      if (!mongoose.Types.ObjectId.isValid(syllabusId) || !Number.isInteger(syllabusVersion) || syllabusVersion < 1 || !topicKey || topicKey.length > 120) return res.status(400).json({ error: 'Invalid topic mapping' });
      const cacheKey = `${syllabusId}:${syllabusVersion}`;
      let topicKeys = syllabusCache.get(cacheKey);
      if (!topicKeys) {
        const syllabus = await Syllabus.findOne({ _id: syllabusId, version: syllabusVersion, status: 'published' }).select('topics').lean();
        if (!syllabus) return res.status(400).json({ error: 'Every mapping must target a published syllabus version' });
        topicKeys = new Set(syllabus.topics.map((topic) => topic.topicKey));
        syllabusCache.set(cacheKey, topicKeys);
      }
      if (!topicKeys.has(topicKey)) return res.status(400).json({ error: `Topic ${topicKey} does not exist in the selected syllabus` });
      mappings.push({ syllabusId: new mongoose.Types.ObjectId(syllabusId), syllabusVersion, topicKey });
    }
    normalizedEntries.push({ questionId, mappings });
  }
  const existingCount = await Question.countDocuments({ _id: { $in: [...questionIds] } });
  if (existingCount !== questionIds.size) return res.status(404).json({ error: 'One or more questions were not found' });
  const result = await Question.bulkWrite(normalizedEntries.map((entry) => ({ updateOne: { filter: { _id: entry.questionId }, update: { $set: { topicRefs: entry.mappings } } } })));
  return res.json({ matchedCount: result.matchedCount, modifiedCount: result.modifiedCount, mappedQuestions: normalizedEntries.length });
});

router.put('/questions/:questionId/topic-mappings', async (req: Request, res: Response) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.questionId)) return res.status(400).json({ error: 'Invalid question ID' });
  const mappings = req.body.mappings;
  if (!Array.isArray(mappings) || mappings.length > 20) return res.status(400).json({ error: 'mappings must be an array with at most 20 items' });
  const normalizedMappings: Array<{ syllabusId: mongoose.Types.ObjectId; syllabusVersion: number; topicKey: string }> = [];
  const seen = new Set<string>();
  for (const rawMapping of mappings) {
    const mapping = (rawMapping || {}) as Record<string, unknown>;
    if (!mongoose.Types.ObjectId.isValid(String(mapping.syllabusId))) return res.status(400).json({ error: 'Invalid syllabus ID in mapping' });
    const syllabusVersion = Number(mapping.syllabusVersion);
    const topicKey = boundedString(mapping.topicKey, 'topicKey', 120, true) as string;
    if (!Number.isInteger(syllabusVersion) || syllabusVersion < 1) return res.status(400).json({ error: 'Invalid syllabus version in mapping' });
    const key = `${mapping.syllabusId}:${syllabusVersion}:${topicKey}`;
    if (seen.has(key)) return res.status(400).json({ error: 'Duplicate topic mapping' });
    seen.add(key);
    normalizedMappings.push({ syllabusId: new mongoose.Types.ObjectId(String(mapping.syllabusId)), syllabusVersion, topicKey });
  }
  for (const mapping of normalizedMappings) {
    const syllabus = await Syllabus.findOne({ _id: mapping.syllabusId, version: mapping.syllabusVersion, status: 'published' }).select('topics').lean();
    if (!syllabus || !syllabus.topics.some((topic) => topic.topicKey === mapping.topicKey)) return res.status(400).json({ error: `Topic ${mapping.topicKey} does not exist in a published syllabus version` });
  }
  const question = await Question.findByIdAndUpdate(req.params.questionId, { $set: { topicRefs: normalizedMappings } }, { new: true, runValidators: true });
  if (!question) return res.status(404).json({ error: 'Question not found' });
  return res.json({ question });
});

router.post('/imports', async (req: Request, res: Response) => {
  try {
    const input = validateBatchInput(req.body as Record<string, unknown>);
    const records: unknown[] = Array.isArray(req.body.questions) ? req.body.questions : [];
    if (records.length === 0 || records.length > 5000) {
      return res.status(400).json({ error: 'questions must contain between 1 and 5000 records' });
    }

    const staged = records.map((record: unknown, index: number) => stageQuestion(record, index));
    const duplicateFingerprints = new Set<string>();
    for (const question of staged) {
      if (duplicateFingerprints.has(question.sourceFingerprint)) question.validationIssues.push('duplicate-fingerprint-in-batch');
      duplicateFingerprints.add(question.sourceFingerprint);
    }

    const issueCounts = staged.reduce<Record<string, number>>((counts, question) => {
      for (const issue of question.validationIssues) counts[issue] = (counts[issue] || 0) + 1;
      return counts;
    }, {});

    const batch = await ImportBatch.create({
      ...input,
      createdBy: req.user!.id,
      status: 'needs_review',
      questionCount: staged.length,
      validationSummary: issueCounts,
    });

    await StagedQuestion.insertMany(staged.map((question) => ({ ...question, batchId: batch._id })), { ordered: true });
    return res.status(201).json({ batch, validationSummary: issueCounts });
  } catch (error) {
    if ((error as { code?: number }).code === 11000) return res.status(409).json({ error: 'An import with this source file and hash already exists' });
    return res.status(400).json({ error: (error as Error).message });
  }
});

router.get('/imports', async (req: Request, res: Response) => {
  const { status, limit = 50, skip = 0 } = req.query;
  const query = status ? { status } : {};
  const [batches, total] = await Promise.all([
    ImportBatch.find(query).sort({ createdAt: -1 }).skip(Number(skip)).limit(Math.min(Number(limit), 100)),
    ImportBatch.countDocuments(query),
  ]);
  return res.json({ batches, total });
});

router.get('/imports/:batchId', async (req: Request, res: Response) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.batchId)) return res.status(400).json({ error: 'Invalid batch ID' });
  const batch = await ImportBatch.findById(req.params.batchId).populate('createdBy approvedBy', 'name email role');
  if (!batch) return res.status(404).json({ error: 'Import batch not found' });
  const counts = await StagedQuestion.aggregate([{ $match: { batchId: batch._id } }, { $group: { _id: '$status', count: { $sum: 1 } } }]);
  return res.json({ batch, questionStatusCounts: Object.fromEntries(counts.map((entry) => [entry._id, entry.count])) });
});

router.get('/imports/:batchId/questions', async (req: Request, res: Response) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.batchId)) return res.status(400).json({ error: 'Invalid batch ID' });
  const { status, limit = 100, skip = 0 } = req.query;
  const query: Record<string, unknown> = { batchId: req.params.batchId };
  if (status) query.status = status;
  const [questions, total] = await Promise.all([
    StagedQuestion.find(query).sort({ createdAt: 1 }).skip(Number(skip)).limit(Math.min(Number(limit), 200)),
    StagedQuestion.countDocuments(query),
  ]);
  return res.json({ questions, total });
});

router.patch('/imports/:batchId/questions/:questionId', async (req: Request, res: Response) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.batchId) || !mongoose.Types.ObjectId.isValid(req.params.questionId)) return res.status(400).json({ error: 'Invalid import or question ID' });
  const allowed = ['questionNumber', 'questionText', 'rawText', 'type', 'marks', 'options', 'correctAnswer', 'difficulty', 'tags', 'sourceLocation', 'extractionQuality', 'reviewNotes', 'status'];
  const update: Record<string, unknown> = {};
  for (const key of allowed) if (req.body[key] !== undefined) update[key] = req.body[key];
  if (update.status && !['pending', 'accepted', 'rejected', 'needs_changes'].includes(String(update.status))) return res.status(400).json({ error: 'Invalid review status' });
  if (update.status) {
    update.reviewedBy = req.user!.id;
    update.reviewedAt = new Date();
  }
  const question = await StagedQuestion.findOneAndUpdate({ _id: req.params.questionId, batchId: req.params.batchId }, { $set: update }, { new: true, runValidators: true });
  if (!question) return res.status(404).json({ error: 'Staged question not found' });
  return res.json({ question });
});

router.post('/imports/:batchId/approve', async (req: Request, res: Response) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.batchId)) return res.status(400).json({ error: 'Invalid batch ID' });
  const batch = await ImportBatch.findById(req.params.batchId);
  if (!batch) return res.status(404).json({ error: 'Import batch not found' });
  if (!['needs_review', 'uploaded'].includes(batch.status)) return res.status(409).json({ error: `Batch cannot be approved from ${batch.status}` });
  const pending = await StagedQuestion.countDocuments({ batchId: batch._id, status: { $in: ['pending', 'needs_changes'] } });
  const acceptedCount = await StagedQuestion.countDocuments({ batchId: batch._id, status: 'accepted' });
  if (pending > 0) return res.status(409).json({ error: 'Review every staged question before approval', pending });
  if (acceptedCount === 0) return res.status(409).json({ error: 'At least one question must be accepted' });
  batch.status = 'approved';
  batch.acceptedCount = acceptedCount;
  batch.rejectedCount = await StagedQuestion.countDocuments({ batchId: batch._id, status: 'rejected' });
  batch.approvedBy = new mongoose.Types.ObjectId(req.user!.id);
  batch.approvedAt = new Date();
  await batch.save();
  return res.json({ batch });
});

router.post('/imports/:batchId/reject', async (req: Request, res: Response) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.batchId)) return res.status(400).json({ error: 'Invalid batch ID' });
  const batch = await ImportBatch.findByIdAndUpdate(req.params.batchId, { status: 'rejected', errorMessages: [String(req.body.reason || 'Rejected during administrative review')] }, { new: true });
  if (!batch) return res.status(404).json({ error: 'Import batch not found' });
  await StagedQuestion.updateMany({ batchId: batch._id, status: { $in: ['pending', 'needs_changes'] } }, { $set: { status: 'rejected', reviewedBy: req.user!.id, reviewedAt: new Date() } });
  return res.json({ batch });
});

router.post('/imports/:batchId/promote', async (req: Request, res: Response) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.batchId)) return res.status(400).json({ error: 'Invalid batch ID' });
  const batch = await ImportBatch.findById(req.params.batchId);
  if (!batch) return res.status(404).json({ error: 'Import batch not found' });
  if (!['approved', 'promoted'].includes(batch.status)) return res.status(409).json({ error: 'Only an approved batch can be promoted' });

  const paperUniversity = ['GU', 'TRICHY', 'KES', 'OTHER'].includes(batch.metadata.university)
    ? batch.metadata.university
    : 'OTHER';
  const paper = await Paper.findOneAndUpdate(
    { fileName: batch.sourceFileName },
    {
      $set: {
        semester: batch.metadata.semester,
        subject: batch.metadata.subject,
        title: batch.metadata.title,
        year: batch.metadata.year,
        university: paperUniversity,
        sourceSha256: batch.sourceSha256,
        sourcePath: batch.sourcePath,
        importBatchId: batch._id,
        reviewStatus: 'published',
        publishedAt: new Date(),
        status: 'COMPLETED',
        questionsExtracted: true,
      },
      $setOnInsert: { fileName: batch.sourceFileName },
    },
    { upsert: true, new: true, runValidators: true }
  );

  const acceptedQuestions = await StagedQuestion.find({ batchId: batch._id, status: 'accepted' });
  let promotedCount = 0;
  for (const staged of acceptedQuestions) {
    await Question.findOneAndUpdate(
      { paperId: paper._id, sourceFingerprint: staged.sourceFingerprint },
      {
        $set: {
          semester: batch.metadata.semester,
          subject: batch.metadata.subject,
          questionNumber: staged.questionNumber,
          type: staged.type,
          marks: staged.marks,
          questionText: staged.questionText,
          options: staged.options,
          correctAnswer: staged.correctAnswer,
          difficulty: staged.difficulty,
          tags: staged.tags,
          source: { fileName: batch.sourceFileName, year: batch.metadata.year, university: batch.metadata.university },
          extractionQuality: staged.extractionQuality,
          importBatchId: batch._id,
          rawText: staged.rawText,
          sourceFingerprint: staged.sourceFingerprint,
          sourceLocation: staged.sourceLocation,
          validationIssues: staged.validationIssues,
          reviewStatus: 'published',
          publishedAt: new Date(),
        },
      },
      { upsert: true, new: true, runValidators: true }
    );
    staged.status = 'promoted';
    await staged.save();
    promotedCount += 1;
  }

  const [totalQuestions, totals] = await Promise.all([
    Question.countDocuments({ paperId: paper._id }),
    Question.aggregate([{ $match: { paperId: paper._id } }, { $group: { _id: null, marks: { $sum: '$marks' } } }]),
  ]);
  await Paper.findByIdAndUpdate(paper._id, { totalQuestions, totalMarks: totals[0]?.marks || 0 });
  batch.status = 'promoted';
  batch.promotedAt = new Date();
  await batch.save();
  return res.json({ batch, paper, promotedCount });
});

router.post('/formatted-answers', async (req: Request, res: Response) => {
  try {
    const { questionNumber, questionText, questionTextGu, marks, year, university, subject, semester = 1, blocks } = req.body;
    if (!questionTextGu || !Array.isArray(blocks) || blocks.length === 0 || !year || !university || !subject) {
      return res.status(400).json({ error: 'questionTextGu, blocks, year, university, and subject are required' });
    }
    const normalizedSubject = String(subject).toUpperCase();
    const normalizedUniversity = String(university).toUpperCase();
    const paperFileName = `manual-${normalizedUniversity}-${year}-${normalizedSubject.toLowerCase().replace(/[^a-z0-9]+/gi, '-')}.paper`;
    const paper = await Paper.findOneAndUpdate(
      { fileName: paperFileName },
      {
        $setOnInsert: {
          semester: Number(semester), subject: normalizedSubject, title: `${normalizedSubject} ${year} Manual Questions`,
          fileName: paperFileName, year: Number(year), university: normalizedUniversity,
          status: 'COMPLETED', questionsExtracted: true, reviewStatus: 'published', publishedAt: new Date(),
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    const normalizedBlocks = blocks.filter((block: any) => ['heading', 'paragraph', 'bold', 'line', 'table'].includes(block?.type));
    const plainText = normalizedBlocks.map((block: any) => block.type === 'table' ? (block.rows || []).map((row: string[]) => row.join(' | ')).join('\n') : (block.text || '')).filter(Boolean).join('\n\n');
    const question = await Question.findOneAndUpdate(
      { paperId: paper._id, questionTextGu: String(questionTextGu).trim() },
      {
        $set: {
          questionNumber: String(questionNumber || 'MANUAL'), questionText: String(questionText || questionTextGu).trim(), questionTextGu: String(questionTextGu).trim(),
          type: 'LONG', marks: Number(marks || 25), semester: Number(semester), subject: normalizedSubject,
          source: { fileName: paperFileName, year: Number(year), university: normalizedUniversity },
          extractionQuality: 100, validationIssues: [], reviewStatus: 'published', publishedAt: new Date(),
        },
        $setOnInsert: { paperId: paper._id, tags: [normalizedSubject.toLowerCase()] },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    const answer = await Answer.findOneAndUpdate(
      { questionId: question._id, type: 'long', language: 'gu' },
      {
        $set: {
          paperId: paper._id, text: plainText, formattedContent: normalizedBlocks, wordCount: plainText.split(/\s+/).filter(Boolean).length,
          generatedBy: 'manual', qualityScore: 10, verified: true, difficulty: 'medium', keyPoints: [], studyTips: [],
          sources: [{ type: 'article', title: 'Manual Gujarati answer entry', year: Number(year) }],
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    await Paper.findByIdAndUpdate(paper._id, { $inc: { totalQuestions: 1, totalMarks: Number(marks || 25) } });
    return res.status(201).json({ success: true, paper, question, answer });
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
