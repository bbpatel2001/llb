import { Router, Request, Response } from 'express';
import { Answer } from '../models/Answer';
import { Question } from '../models/Question';
import AnswerGenerationService from '../services/answerGenerationService';
import AnswerGuidanceService from '../services/answerGuidanceService';
import { getAnswerLanguage } from '../config/languages';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

// ============================================================================
// ANSWER GENERATION ENDPOINTS
// ============================================================================

/**
 * Generate short answer for a question
 * POST /api/answers/generate/short
 */
router.post('/generate/short', authenticate, async (req: Request, res: Response): Promise<any> => {
  try {
    const { questionId, language: requestedLanguage } = req.body;
    const language = getAnswerLanguage(requestedLanguage);
    if (!questionId) {
      return res.status(400).json({ error: 'questionId is required' });
    }

    const answer = await AnswerGenerationService.generateShortAnswer(questionId, language);
    return res.json({ success: true, answer });
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * Generate long answer for a question
 * POST /api/answers/generate/long
 */
router.post('/generate/long', authenticate, async (req: Request, res: Response): Promise<any> => {
  try {
    const { questionId, language: requestedLanguage } = req.body;
    const language = getAnswerLanguage(requestedLanguage);
    if (!questionId) {
      return res.status(400).json({ error: 'questionId is required' });
    }

    const answer = await AnswerGenerationService.generateLongAnswer(questionId, language);
    return res.json({ success: true, answer });
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * Generate MCQ answer
 * POST /api/answers/generate/mcq
 */
router.post('/generate/mcq', authenticate, async (req: Request, res: Response): Promise<any> => {
  try {
    const { questionId } = req.body;
    if (!questionId) {
      return res.status(400).json({ error: 'questionId is required' });
    }

    const answer = await AnswerGenerationService.generateMCQAnswer(questionId);
    return res.json({ success: true, answer });
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * Generate case study answer
 * POST /api/answers/generate/case-study
 */
router.post('/generate/case-study', authenticate, async (req: Request, res: Response): Promise<any> => {
  try {
    const { questionId } = req.body;
    if (!questionId) {
      return res.status(400).json({ error: 'questionId is required' });
    }

    const answer = await AnswerGenerationService.generateCaseStudyAnswer(questionId);
    return res.json({ success: true, answer });
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * Generate all answer types for a question
 * POST /api/answers/generate/all
 */
router.post('/generate/all', authenticate, async (req: Request, res: Response): Promise<any> => {
  try {
    const { questionId, language: requestedLanguage } = req.body;
    const language = getAnswerLanguage(requestedLanguage);
    if (!questionId) {
      return res.status(400).json({ error: 'questionId is required' });
    }

    const answers = await AnswerGenerationService.generateAllAnswers(questionId, language);
    return res.json({ success: true, answers, count: answers.length });
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * Generate answers for all questions in subject/semester
 * POST /api/answers/generate/bulk
 */
router.post('/generate/bulk', authenticate, requireRole('admin', 'instructor'), async (req: Request, res: Response): Promise<any> => {
  try {
    const { semester, subject, limit, language: requestedLanguage } = req.body;
    const language = getAnswerLanguage(requestedLanguage);
    if (!semester || !subject) {
      return res.status(400).json({ error: 'semester and subject are required' });
    }

    const result = await AnswerGenerationService.generateAnswersForSubject(
      semester,
      subject,
      limit,
      language
    );
    return res.json({
      success: true,
      message: `Generated ${result.generated} answers, ${result.failed} failed`,
      ...result,
    });
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
});

// ============================================================================
// ANSWER RETRIEVAL ENDPOINTS
// ============================================================================

/**
 * Get answers for all questions in a paper
 * GET /api/answers/paper/:paperId
 */
router.get('/paper/:paperId', async (req: Request, res: Response): Promise<any> => {
  try {
    const { paperId } = req.params;
    const { type, skip = 0, limit = 50 } = req.query;
    const query: any = { paperId };

    if (type) query.type = type;

    const offset = Math.max(parseInt(skip as string, 10) || 0, 0);
    const pageSize = Math.min(Math.max(parseInt(limit as string, 10) || 50, 1), 100);
    const [answers, total] = await Promise.all([
      Answer.find(query)
        .skip(offset)
        .limit(pageSize)
        .sort({ createdAt: -1 }),
      Answer.countDocuments(query),
    ]);

    return res.json({
      success: true,
      answers,
      total,
      page: Math.floor(offset / pageSize) + 1,
    });
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * Get all answers for a question
 * GET /api/answers/:questionId
 */
router.get('/:questionId([0-9a-fA-F]{24})', async (req: Request, res: Response): Promise<any> => {
  try {
    const { questionId } = req.params;
    const language = getAnswerLanguage(req.query.language);
    const languageQuery = language === 'en'
      ? { $or: [{ language: 'en' }, { language: { $exists: false } }] }
      : { language };
    const [question, answers] = await Promise.all([
      Question.findById(questionId),
      Answer.find({ questionId, ...languageQuery }).sort({ type: 1 }),
    ]);
    const enrichedAnswers = answers.map((answer) => {
      if (!question || (answer.type !== 'short' && answer.type !== 'long')) {
        return answer;
      }

      const answerObject = answer.toObject();
      return {
        ...answerObject,
        // Existing answers are enriched at read time, so older generic records
        // immediately receive question-specific writing guidance as well.
        writingGuide: answerObject.writingGuide || AnswerGuidanceService.buildWritingGuide(question, answer.type, language),
      };
    });

    return res.json({
      success: true,
      answers: enrichedAnswers,
      count: enrichedAnswers.length,
    });
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * Get specific answer type for a question
 * GET /api/answers/:questionId/:type
 */
router.get('/:questionId/:type', async (req: Request, res: Response): Promise<any> => {
  try {
    const { questionId, type } = req.params;
    const language = getAnswerLanguage(req.query.language);
    const answer = await Answer.findOne({ questionId, type, language: language === 'en' ? { $in: ['en', null] } : language });

    if (!answer) {
      return res.status(404).json({ error: 'Answer not found' });
    }

    return res.json({ success: true, answer });
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * Get answers by semester
 * GET /api/answers/semester/:semester
 */
router.get('/by-semester/:semester', async (req: Request, res: Response): Promise<any> => {
  try {
    const { subject, type, skip = 0, limit = 50 } = req.query;

    const query: any = {};
    if (subject) query.subject = subject;
    if (type) query.type = type;

    const answers = await Answer.find(query)
      .skip(parseInt(skip as string))
      .limit(parseInt(limit as string))
      .sort({ createdAt: -1 });

    const total = await Answer.countDocuments(query);

    return res.json({
      success: true,
      answers,
      total,
      page: Math.floor(parseInt(skip as string) / parseInt(limit as string)) + 1,
    });
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * Get verified answers
 * GET /api/answers/verified/list
 */
router.get('/verified/list', async (req: Request, res: Response): Promise<any> => {
  try {
    const { skip = 0, limit = 50 } = req.query;

    const answers = await Answer.find({ verified: true })
      .skip(parseInt(skip as string))
      .limit(parseInt(limit as string))
      .sort({ qualityScore: -1 });

    const total = await Answer.countDocuments({ verified: true });

    return res.json({
      success: true,
      answers,
      total,
    });
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * Search answers
 * GET /api/answers/search
 */
router.get('/search', async (req: Request, res: Response): Promise<any> => {
  try {
    const { query, subject, difficulty, skip = 0, limit = 20 } = req.query;

    if (!query) {
      return res.status(400).json({ error: 'search query is required' });
    }

    const searchQuery: any = {
      $text: { $search: query as string },
    };

    if (subject) searchQuery.subject = subject;
    if (difficulty) searchQuery.difficulty = difficulty;

    const answers = await Answer.find(searchQuery)
      .skip(parseInt(skip as string))
      .limit(parseInt(limit as string))
      .sort({ score: { $meta: 'textScore' } });

    const total = await Answer.countDocuments(searchQuery);

    return res.json({
      success: true,
      answers,
      total,
    });
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
});

// ============================================================================
// ANSWER MANAGEMENT ENDPOINTS (for admins/instructors)
// ============================================================================

/**
 * Verify an answer
 * PATCH /api/answers/:answerId/verify
 */
router.patch('/:answerId/verify', authenticate, requireRole('admin', 'instructor'), async (req: Request, res: Response): Promise<any> => {
  try {
    const { answerId } = req.params;
    const { verified, qualityScore } = req.body;

    const answer = await Answer.findByIdAndUpdate(
      answerId,
      {
        verified: verified !== undefined ? verified : true,
        qualityScore: qualityScore || undefined,
      },
      { new: true }
    );

    if (!answer) {
      return res.status(404).json({ error: 'Answer not found' });
    }

    return res.json({ success: true, answer });
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * Update answer
 * PATCH /api/answers/:answerId
 */
router.patch('/:answerId', authenticate, requireRole('admin', 'instructor'), async (req: Request, res: Response): Promise<any> => {
  try {
    const { answerId } = req.params;
    const updates = req.body;

    const answer = await Answer.findByIdAndUpdate(answerId, updates, {
      new: true,
    });

    if (!answer) {
      return res.status(404).json({ error: 'Answer not found' });
    }

    return res.json({ success: true, answer });
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * Delete answer
 * DELETE /api/answers/:answerId
 */
router.delete('/:answerId', authenticate, requireRole('admin', 'instructor'), async (req: Request, res: Response): Promise<any> => {
  try {
    const { answerId } = req.params;

    const answer = await Answer.findByIdAndDelete(answerId);

    if (!answer) {
      return res.status(404).json({ error: 'Answer not found' });
    }

    return res.json({ success: true, message: 'Answer deleted successfully' });
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * Get answer statistics
 * GET /api/answers/stats
 */
router.get('/stats', async (_req: Request, res: Response): Promise<any> => {
  try {
    const stats = await Answer.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          verified: { $sum: { $cond: ['$verified', 1, 0] } },
          avgQualityScore: { $avg: '$qualityScore' },
          byType: { $push: '$type' },
          byDifficulty: { $push: '$difficulty' },
        },
      },
    ]);

    const typeCount = await Answer.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } },
    ]);

    const difficultyCount = await Answer.aggregate([
      { $group: { _id: '$difficulty', count: { $sum: 1 } } },
    ]);

    return res.json({
      success: true,
      summary: stats[0] || { total: 0, verified: 0 },
      byType: Object.fromEntries(typeCount.map((t) => [t._id, t.count])),
      byDifficulty: Object.fromEntries(
        difficultyCount.map((d) => [d._id, d.count])
      ),
    });
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
