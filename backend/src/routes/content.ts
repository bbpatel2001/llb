import { Router, Request, Response } from 'express';
import { ContentGenerationService } from '../services/contentGenerationService';
import { Answer } from '../models/Answer';
import { FlashcardDeck } from '../models/Flashcard';
import { Timeline } from '../models/Timeline';
import { CaseLaw } from '../models/CaseLaw';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

// ============================================================================
// ANSWERS ENDPOINTS
// ============================================================================

/**
 * Generate short answer for a question
 * POST /api/content/answers/generate/short
 */
router.post('/answers/generate/short', authenticate, async (req: Request, res: Response): Promise<any> => {
  try {
    const { questionId } = req.body;
    if (!questionId) {
      return res.status(400).json({ error: 'questionId is required' });
    }

    const answer = await ContentGenerationService.generateShortAnswer(questionId);
    return res.json({ success: true, answer });
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * Generate long answer for a question
 * POST /api/content/answers/generate/long
 */
router.post('/answers/generate/long', authenticate, async (req: Request, res: Response): Promise<any> => {
  try {
    const { questionId } = req.body;
    if (!questionId) {
      return res.status(400).json({ error: 'questionId is required' });
    }

    const answer = await ContentGenerationService.generateLongAnswer(questionId);
    return res.json({ success: true, answer });
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * Get all answers for a question
 * GET /api/content/answers/:questionId
 */
router.get('/answers/:questionId', async (req: Request, res: Response): Promise<any> => {
  try {
    const { questionId } = req.params;
    const answers = await Answer.find({ questionId }).sort({ type: 1 });

    return res.json({
      answers,
      count: answers.length,
    });
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * Get answers by semester
 * GET /api/content/answers/semester/:semester
 */
router.get('/answers-by-semester/:semester', async (req: Request, res: Response): Promise<any> => {
  try {
    const { limit = 50 } = req.query;
    const { subject } = req.query;

    const query: any = {};
    if (subject) query.subject = subject;

    const answers = await Answer.find(query)
      .populate('questionId')
      .limit(parseInt(limit as string))
      .sort({ createdAt: -1 });

    return res.json({
      answers,
      count: answers.length,
    });
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
});

// ============================================================================
// FLASHCARDS ENDPOINTS
// ============================================================================

/**
 * Generate flashcards for a subject/semester
 * POST /api/content/flashcards/generate
 */
router.post('/flashcards/generate', authenticate, async (req: Request, res: Response): Promise<any> => {
  try {
    const { subject, semester, limit = 1000 } = req.body;

    if (!subject || !semester) {
      return res.status(400).json({ error: 'subject and semester are required' });
    }

    const result = await ContentGenerationService.generateFlashcards(
      subject,
      semester,
      limit
    );

    return res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * Get all flashcard decks
 * GET /api/content/flashcards/decks
 */
router.get('/flashcards/decks', authenticate, async (req: Request, res: Response) => {
  try {
    const { subject, semester, limit = 20, skip = 0 } = req.query;

    const query: any = {};
    if (subject) query.subject = subject;
    if (semester) query.semester = parseInt(semester as string);

    const decks = await FlashcardDeck.find(query)
      .skip(parseInt(skip as string))
      .limit(parseInt(limit as string))
      .sort({ createdAt: -1 });

    const total = await FlashcardDeck.countDocuments(query);

    res.json({
      decks,
      total,
      page: Math.floor(parseInt(skip as string) / parseInt(limit as string)) + 1,
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * Get flashcards by deck
 * GET /api/content/flashcards/deck/:deckId
 */
router.get('/flashcards/deck/:deckId', authenticate, async (req: Request, res: Response): Promise<any> => {
  try {
    const { deckId } = req.params;
    const { limit = 500 } = req.query;

    const result = await ContentGenerationService.getFlashcardsByDeck(
      deckId,
      parseInt(limit as string)
    );

    return res.json({
      deck: result.deck,
      flashcards: result.flashcards,
      count: result.count,
      availableCount: result.availableCount,
    });
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
});

// ============================================================================
// TIMELINE ENDPOINTS
// ============================================================================

/**
 * Generate timeline for a topic
 * POST /api/content/timelines/generate
 */
router.post('/timelines/generate', authenticate, async (req: Request, res: Response): Promise<any> => {
  try {
    const { subject, topic } = req.body;

    if (!subject || !topic) {
      return res.status(400).json({ error: 'subject and topic are required' });
    }

    const timeline = await ContentGenerationService.generateTimeline(subject, topic);

    return res.json({
      success: true,
      timeline,
    });
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * Get all timelines
 * GET /api/content/timelines
 */
router.get('/timelines', async (req: Request, res: Response) => {
  try {
    const { subject, limit = 20, skip = 0 } = req.query;

    const query: any = {};
    if (subject) query.subject = subject;

    const timelines = await Timeline.find(query)
      .skip(parseInt(skip as string))
      .limit(parseInt(limit as string))
      .sort({ createdAt: -1 });

    const total = await Timeline.countDocuments(query);

    res.json({
      timelines,
      total,
      page: Math.floor(parseInt(skip as string) / parseInt(limit as string)) + 1,
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * Get timeline by ID
 * GET /api/content/timelines/:timelineId
 */
router.get('/timelines/:timelineId', async (req: Request, res: Response): Promise<any> => {
  try {
    const { timelineId } = req.params;
    const timeline = await Timeline.findById(timelineId);

    if (!timeline) {
      return res.status(404).json({ error: 'Timeline not found' });
    }

    return res.json(timeline);
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
});

// ============================================================================
// CASE LAW ENDPOINTS
// ============================================================================

/**
 * Create or add case law
 * POST /api/content/cases
 */
router.post('/cases', authenticate, requireRole('admin', 'instructor'), async (req: Request, res: Response) => {
  try {
    const { name, citation, court, year, facts, issue, held, ratio, significance } = req.body;

    const caseLaw = new CaseLaw({
      name,
      citation,
      court,
      year,
      facts,
      issue,
      held,
      ratio,
      significance,
    });

    await caseLaw.save();

    res.status(201).json({
      success: true,
      caseLaw,
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * Get all cases
 * GET /api/content/cases
 */
router.get('/cases', async (req: Request, res: Response) => {
  try {
    const { court, limit = 20, skip = 0, search } = req.query;

    const query: any = {};
    if (court) query.court = court;
    if (search) {
      query.$text = { $search: search as string };
    }

    const cases = await CaseLaw.find(query)
      .skip(parseInt(skip as string))
      .limit(parseInt(limit as string))
      .sort({ year: -1 });

    const total = await CaseLaw.countDocuments(query);

    res.json({
      cases,
      total,
      page: Math.floor(parseInt(skip as string) / parseInt(limit as string)) + 1,
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * Get case by ID
 * GET /api/content/cases/:caseId
 */
router.get('/cases/:caseId', async (req: Request, res: Response): Promise<any> => {
  try {
    const { caseId } = req.params;
    const caseLaw = await CaseLaw.findById(caseId);

    if (!caseLaw) {
      return res.status(404).json({ error: 'Case not found' });
    }

    return res.json(caseLaw);
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
});

// ============================================================================
// CONTENT STATISTICS
// ============================================================================

/**
 * Get content statistics
 * GET /api/content/stats
 */
router.get('/stats', async (_req: Request, res: Response): Promise<any> => {
  try {
    const [answerCount, deckCount, timelineCount, caseCount] = await Promise.all([
      Answer.countDocuments(),
      FlashcardDeck.countDocuments(),
      Timeline.countDocuments(),
      CaseLaw.countDocuments(),
    ]);

    return res.json({
      answers: answerCount,
      flashcardDecks: deckCount,
      timelines: timelineCount,
      cases: caseCount,
    });
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
