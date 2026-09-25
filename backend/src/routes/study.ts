import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { authenticate } from '../middleware/auth';
import { Bookmark, BookmarkTargetType } from '../models/Bookmark';
import { Note, NoteTargetType } from '../models/Note';
import { StudyProgress, StudyTargetType } from '../models/StudyProgress';
import { FlashcardProgress } from '../models/FlashcardProgress';
import { FlashcardAttempt } from '../models/FlashcardAttempt';
import { Flashcard } from '../models/Flashcard';
import { Question } from '../models/Question';
import { Syllabus } from '../models/Syllabus';

const router = Router();
router.use(authenticate);

const targetTypes = new Set(['question', 'answer', 'flashcard', 'case_law', 'paper', 'quiz', 'topic']);

function validTargetType(value: unknown): value is StudyTargetType {
  return typeof value === 'string' && targetTypes.has(value);
}

function validId(value: string): boolean {
  return mongoose.Types.ObjectId.isValid(value);
}

function normalizeAnswer(value: unknown): string {
  return typeof value === 'string' ? value.trim().toLowerCase().replace(/[.)]$/, '') : '';
}

function isScorableCard(card: { options?: Array<{ label?: string; text?: string }>; correctAnswer?: string }): boolean {
  if (!Array.isArray(card.options) || card.options.length < 2) return false;
  const correctAnswer = normalizeAnswer(card.correctAnswer);
  return Boolean(correctAnswer && card.options.some((option) => (
    normalizeAnswer(option.label) === correctAnswer || normalizeAnswer(option.text) === correctAnswer
  )));
}

function isCorrectAnswer(card: { options?: Array<{ label?: string; text?: string }>; correctAnswer?: string }, selectedAnswer: string): boolean {
  const correctAnswer = normalizeAnswer(card.correctAnswer);
  const selected = normalizeAnswer(selectedAnswer);
  const selectedOption = card.options?.find((option) => normalizeAnswer(option.label) === selected);
  return Boolean(
    selectedOption
      && (normalizeAnswer(selectedOption.label) === correctAnswer || normalizeAnswer(selectedOption.text) === correctAnswer)
  );
}

router.get('/summary', async (req: Request, res: Response) => {
  const userId = new mongoose.Types.ObjectId(req.user!.id);
  const [progress, bookmarks, notes, dueFlashcards] = await Promise.all([
    StudyProgress.aggregate([
      { $match: { userId } },
      { $group: { _id: '$targetType', items: { $sum: 1 }, viewed: { $sum: '$viewedCount' }, completed: { $sum: '$completedCount' }, timeSpentSeconds: { $sum: '$timeSpentSeconds' } } },
    ]),
    Bookmark.countDocuments({ userId }),
    Note.countDocuments({ userId }),
    FlashcardProgress.countDocuments({ userId, $or: [{ nextReviewAt: { $lte: new Date() } }, { nextReviewAt: { $exists: false } }] }),
  ]);
  return res.json({ progress, bookmarks, notes, dueFlashcards });
});

router.get('/recommendations', async (req: Request, res: Response) => {
  const syllabusQuery: Record<string, unknown> = { status: 'published' };
  if (req.query.syllabusId) {
    if (!validId(String(req.query.syllabusId))) return res.status(400).json({ error: 'Invalid syllabus ID' });
    syllabusQuery._id = String(req.query.syllabusId);
  }
  const syllabus = await Syllabus.findOne(syllabusQuery).sort({ version: -1 }).lean();
  if (!syllabus) return res.status(404).json({ error: 'Published syllabus not found' });
  const syllabusId = syllabus._id;
  const topicQuestionGroups = await Question.aggregate([
    { $match: { topicRefs: { $elemMatch: { syllabusId, syllabusVersion: syllabus.version } }, reviewStatus: { $ne: 'rejected' } } },
    { $unwind: '$topicRefs' },
    { $match: { 'topicRefs.syllabusId': syllabusId, 'topicRefs.syllabusVersion': syllabus.version } },
    { $group: { _id: '$topicRefs.topicKey', questionIds: { $push: '$_id' }, questionCount: { $sum: 1 } } },
  ]);
  const questionIds = topicQuestionGroups.flatMap((group) => group.questionIds);
  const progress = await StudyProgress.find({ userId: req.user!.id, targetType: 'question', targetId: { $in: questionIds.map((id) => id.toString()) } }).lean();
  const progressByQuestion = new Map(progress.map((item) => [item.targetId, item]));
  const topicProgress = await StudyProgress.find({ userId: req.user!.id, targetType: 'topic', targetId: { $regex: `^${syllabusId.toString()}:${syllabus.version}:` } }).lean();
  const progressByTopic = new Map(topicProgress.map((item) => [item.targetId, item]));
  const recommendations = syllabus.topics.map((topic) => {
    const group = topicQuestionGroups.find((item) => item._id === topic.topicKey);
    const mappedQuestionIds = (group?.questionIds || []).map((id: unknown) => String(id));
    const viewedQuestions = mappedQuestionIds.filter((id: string) => (progressByQuestion.get(id)?.viewedCount || 0) > 0).length;
    const topicKey = `${syllabusId.toString()}:${syllabus.version}:${topic.topicKey}`;
    const savedTopicProgress = progressByTopic.get(topicKey);
    const completed = savedTopicProgress?.completedCount || 0;
    const coverage = mappedQuestionIds.length ? viewedQuestions / mappedQuestionIds.length : 0;
    return {
      topicKey: topic.topicKey,
      name: topic.name,
      parentTopicKey: topic.parentTopicKey,
      questionCount: mappedQuestionIds.length,
      viewedQuestionCount: viewedQuestions,
      coverage: Math.round(coverage * 100),
      completedCount: completed,
      recommended: coverage < 0.6,
      reason: mappedQuestionIds.length === 0 ? 'No questions mapped yet' : coverage < 0.6 ? 'Review this topic to improve coverage' : 'Maintain your current review schedule',
    };
  }).sort((left, right) => Number(right.recommended) - Number(left.recommended) || left.coverage - right.coverage);
  return res.json({ syllabus: { _id: syllabus._id, subject: syllabus.subject, subjectCode: syllabus.subjectCode, version: syllabus.version }, recommendations: recommendations.slice(0, Math.min(Number(req.query.limit || 10), 50)) });
});

router.get('/progress', async (req: Request, res: Response) => {
  const query: Record<string, unknown> = { userId: req.user!.id };
  if (req.query.targetType && validTargetType(req.query.targetType)) query.targetType = req.query.targetType;
  if (req.query.targetId) query.targetId = String(req.query.targetId);
  const progress = await StudyProgress.find(query).sort({ updatedAt: -1 }).limit(Math.min(Number(req.query.limit || 100), 200));
  return res.json({ progress });
});

router.patch('/progress/:targetType/:targetId', async (req: Request, res: Response) => {
  const { targetType, targetId } = req.params;
  if (!validTargetType(targetType) || !targetId.trim()) return res.status(400).json({ error: 'Invalid study target' });
  const body = req.body as Record<string, unknown>;
  const increments = {
    viewedCount: Math.max(0, Number(body.viewedIncrement || 0)),
    answeredCount: Math.max(0, Number(body.answeredIncrement || 0)),
    correctCount: Math.max(0, Number(body.correctIncrement || 0)),
    completedCount: Math.max(0, Number(body.completedIncrement || 0)),
    timeSpentSeconds: Math.max(0, Math.min(Number(body.timeSpentSeconds || 0), 86400)),
  };
  const update: Record<string, unknown> = { $inc: increments, $set: { lastViewedAt: new Date() } };
  if (body.completed === true) {
    (update.$set as Record<string, unknown>).completedAt = new Date();
  }
  const progress = await StudyProgress.findOneAndUpdate(
    { userId: req.user!.id, targetType, targetId },
    update,
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return res.json({ progress });
});

router.get('/bookmarks', async (req: Request, res: Response) => {
  const query: Record<string, unknown> = { userId: req.user!.id };
  if (req.query.targetType && validTargetType(req.query.targetType)) query.targetType = req.query.targetType;
  const bookmarks = await Bookmark.find(query).sort({ createdAt: -1 }).limit(Math.min(Number(req.query.limit || 100), 200));
  return res.json({ bookmarks });
});

router.post('/bookmarks', async (req: Request, res: Response) => {
  const { targetType, targetId, label } = req.body as Record<string, unknown>;
  if (!validTargetType(targetType) || typeof targetId !== 'string' || !targetId.trim()) return res.status(400).json({ error: 'targetType and targetId are required' });
  const bookmark = await Bookmark.findOneAndUpdate(
    { userId: req.user!.id, targetType: targetType as BookmarkTargetType, targetId: targetId.trim() },
    { $set: { label: typeof label === 'string' ? label.trim().slice(0, 100) : undefined } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return res.status(201).json({ bookmark });
});

router.delete('/bookmarks/:bookmarkId', async (req: Request, res: Response) => {
  if (!validId(req.params.bookmarkId)) return res.status(400).json({ error: 'Invalid bookmark ID' });
  const bookmark = await Bookmark.findOneAndDelete({ _id: req.params.bookmarkId, userId: req.user!.id });
  if (!bookmark) return res.status(404).json({ error: 'Bookmark not found' });
  return res.json({ success: true });
});

router.get('/notes', async (req: Request, res: Response) => {
  const query: Record<string, unknown> = { userId: req.user!.id };
  if (req.query.targetType && validTargetType(req.query.targetType)) query.targetType = req.query.targetType;
  if (req.query.targetId) query.targetId = String(req.query.targetId);
  const notes = await Note.find(query).sort({ updatedAt: -1 }).limit(Math.min(Number(req.query.limit || 100), 200));
  return res.json({ notes });
});

router.post('/notes', async (req: Request, res: Response) => {
  const { targetType, targetId, body } = req.body as Record<string, unknown>;
  if (!validTargetType(targetType) || typeof targetId !== 'string' || typeof body !== 'string' || !body.trim()) return res.status(400).json({ error: 'targetType, targetId, and non-empty body are required' });
  const note = await Note.create({ userId: req.user!.id, targetType: targetType as NoteTargetType, targetId: targetId.trim(), body: body.trim().slice(0, 5000) });
  return res.status(201).json({ note });
});

router.patch('/notes/:noteId', async (req: Request, res: Response) => {
  if (!validId(req.params.noteId) || typeof req.body.body !== 'string' || !req.body.body.trim()) return res.status(400).json({ error: 'Valid note ID and non-empty body are required' });
  const note = await Note.findOneAndUpdate({ _id: req.params.noteId, userId: req.user!.id }, { $set: { body: req.body.body.trim().slice(0, 5000) } }, { new: true, runValidators: true });
  if (!note) return res.status(404).json({ error: 'Note not found' });
  return res.json({ note });
});

router.delete('/notes/:noteId', async (req: Request, res: Response) => {
  if (!validId(req.params.noteId)) return res.status(400).json({ error: 'Invalid note ID' });
  const note = await Note.findOneAndDelete({ _id: req.params.noteId, userId: req.user!.id });
  if (!note) return res.status(404).json({ error: 'Note not found' });
  return res.json({ success: true });
});

router.post('/flashcards/attempts', async (req: Request, res: Response) => {
  const { deckId, answers, reviewedCards = 0, startedAt } = req.body as {
    deckId?: string;
    answers?: Array<{ cardId?: string; selectedAnswer?: string }>;
    reviewedCards?: number;
    startedAt?: string;
  };
  if (!deckId || !validId(deckId) || !Array.isArray(answers)) {
    return res.status(400).json({ error: 'deckId and answers are required' });
  }

  const submittedAnswers = answers.filter((answer) => validId(String(answer.cardId)) && typeof answer.selectedAnswer === 'string');
  const cardIds = submittedAnswers.map((answer) => String(answer.cardId));
  const cards = await Flashcard.find({
    _id: { $in: cardIds },
    deckId,
    isActive: true,
  }).select('_id options correctAnswer').lean();
  const cardsById = new Map(cards.map((card) => [String(card._id), card]));
  const gradedAnswers = submittedAnswers
    .map((answer) => {
      const card = cardsById.get(String(answer.cardId));
      if (!card || !isScorableCard(card)) return null;
      return {
        flashcardId: card._id,
        selectedAnswer: String(answer.selectedAnswer).trim(),
        isCorrect: isCorrectAnswer(card, String(answer.selectedAnswer)),
      };
    })
    .filter((answer): answer is NonNullable<typeof answer> => Boolean(answer));
  const objectiveCards = cards.filter(isScorableCard).length;
  const correctAnswers = gradedAnswers.filter((answer) => answer.isCorrect).length;
  const percentage = gradedAnswers.length > 0 ? (correctAnswers / gradedAnswers.length) * 100 : 0;
  const parsedStartedAt = startedAt ? new Date(startedAt) : new Date();
  const attempt = await FlashcardAttempt.create({
    userId: req.user!.id,
    deckId,
    answers: gradedAnswers,
    totalCards: cards.length,
    objectiveCards,
    answeredCards: gradedAnswers.length,
    correctAnswers,
    percentage,
    reviewedCards: Number.isInteger(reviewedCards) && reviewedCards >= 0 ? reviewedCards : 0,
    startedAt: Number.isNaN(parsedStartedAt.getTime()) ? new Date() : parsedStartedAt,
    completedAt: new Date(),
  });

  return res.status(201).json({ attempt });
});

router.get('/flashcards/attempts', async (req: Request, res: Response) => {
  const query: Record<string, unknown> = { userId: req.user!.id };
  if (req.query.deckId && validId(String(req.query.deckId))) query.deckId = String(req.query.deckId);
  const skip = Math.max(Number(req.query.skip || 0), 0);
  const limit = Math.min(Math.max(Number(req.query.limit || 20), 1), 100);
  const [attempts, total] = await Promise.all([
    FlashcardAttempt.find(query).populate('deckId', 'name subject semester').sort({ completedAt: -1 }).skip(skip).limit(limit),
    FlashcardAttempt.countDocuments(query),
  ]);
  return res.json({ attempts, total });
});

router.get('/flashcards/due', async (req: Request, res: Response) => {
  const now = new Date();
  const query: Record<string, unknown> = {
    userId: req.user!.id,
    $or: [{ nextReviewAt: { $lte: now } }, { nextReviewAt: { $exists: false } }],
  };
  if (req.query.deckId && validId(String(req.query.deckId))) query.deckId = String(req.query.deckId);
  const progress = await FlashcardProgress.find(query).populate('flashcardId').sort({ nextReviewAt: 1 }).limit(Math.min(Number(req.query.limit || 50), 100));
  return res.json({ cards: progress, count: progress.length });
});

router.post('/flashcards/:cardId/review', async (req: Request, res: Response) => {
  const { cardId } = req.params;
  const quality = Number(req.body.quality);
  if (!validId(cardId) || !Number.isInteger(quality) || quality < 0 || quality > 5) return res.status(400).json({ error: 'cardId and integer quality from 0 to 5 are required' });
  const card = await Flashcard.findById(cardId);
  if (!card) return res.status(404).json({ error: 'Flashcard not found' });

  const reviewId = typeof req.body.reviewId === 'string' ? req.body.reviewId.slice(0, 100) : undefined;
  let progress = await FlashcardProgress.findOne({ userId: req.user!.id, flashcardId: card._id });
  if (progress && reviewId && progress.lastReviewId === reviewId) return res.json({ progress, idempotent: true });
  if (!progress) progress = new FlashcardProgress({ userId: req.user!.id, flashcardId: card._id, deckId: card.deckId });

  progress.viewCount += 1;
  if (quality >= 3) progress.correctCount += 1;
  else progress.incorrectCount += 1;
  progress.easinessFactor = Math.max(1.3, progress.easinessFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));
  if (quality < 3) {
    progress.repetitions = 0;
    progress.interval = 1;
    progress.status = 'learning';
  } else {
    progress.repetitions += 1;
    progress.interval = progress.repetitions === 1 ? 1 : progress.repetitions === 2 ? 6 : Math.round(progress.interval * progress.easinessFactor);
    progress.status = progress.repetitions >= 5 ? 'mastered' : progress.repetitions >= 2 ? 'review' : 'learning';
  }
  progress.lastReviewedAt = new Date();
  progress.nextReviewAt = new Date(Date.now() + progress.interval * 24 * 60 * 60 * 1000);
  if (reviewId) progress.lastReviewId = reviewId;
  await progress.save();
  return res.json({ progress, idempotent: false });
});

export default router;
