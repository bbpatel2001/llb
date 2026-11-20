import { Router, Request, Response } from 'express';
import { Quiz, QuizAttempt } from '../models/Quiz';
import QuizGenerationService from '../services/quizGenerationService';
import { authenticate, isPrivileged, requireRole } from '../middleware/auth';

const router = Router();

// Practice tests and their content are available only to signed-in users.
router.use(authenticate);

async function assertAttemptOwnership(req: Request, res: Response, attemptId: string): Promise<boolean> {
  const attempt = await QuizAttempt.findOne({ _id: attemptId, userId: req.user!.id }).select('_id').lean();
  if (!attempt) {
    res.status(404).json({ error: 'Attempt not found' });
    return false;
  }
  return true;
}

// ============================================================================
// QUIZ MANAGEMENT ENDPOINTS (Admin)
// ============================================================================

/**
 * Create a new quiz
 * POST /api/quizzes/create
 */
router.post('/create', requireRole('admin', 'instructor'), async (req: Request, res: Response): Promise<any> => {
  try {
    const {
      title,
      description,
      subject,
      semester,
      difficulty,
      questionIds,
      isPaid,
      tags,
      visibility,
    } = req.body;

    if (!title || !subject || !semester || !questionIds) {
      return res.status(400).json({
        error: 'title, subject, semester, questionIds are required',
      });
    }

    const quiz = await QuizGenerationService.createQuiz({
      title,
      description,
      subject,
      semester,
      difficulty: difficulty || 'intermediate',
      questionIds,
      createdBy: req.user!.id,
      isPaid: isPaid || false,
      tags,
      visibility: visibility || 'draft',
    });

    return res.status(201).json({ success: true, quiz });
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * Auto-generate quiz from questions
 * POST /api/quizzes/auto-generate
 */
router.post('/auto-generate', requireRole('admin', 'instructor'), async (req: Request, res: Response): Promise<any> => {
  try {
    const {
      title,
      subject,
      semester,
      totalQuestions,
      difficulty,
      isPaid,
      targetMarks,
    } = req.body;

    if (!subject || !semester || !totalQuestions || !difficulty) {
      return res.status(400).json({
        error: 'subject, semester, totalQuestions, and difficulty are required',
      });
    }

    const quiz = await QuizGenerationService.generateAutoQuiz({
      title: title || `${subject} Quiz - ${difficulty}`,
      subject,
      semester,
      totalQuestions,
      difficulty,
      createdBy: req.user!.id,
      isPaid: isPaid || false,
      targetMarks,
    });

    return res.status(201).json({ success: true, quiz });
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * Generate MCQ-only quiz
 * POST /api/quizzes/mcq-generate
 */
router.post('/mcq-generate', requireRole('admin', 'instructor'), async (req: Request, res: Response): Promise<any> => {
  try {
    const { title, subject, semester, questionCount, isPaid } = req.body;

    if (!subject || !semester || !questionCount) {
      return res.status(400).json({
        error: 'subject, semester, and questionCount are required',
      });
    }

    const quiz = await QuizGenerationService.generateMCQQuiz({
      title: title || `${subject} - MCQ Quiz`,
      subject,
      semester,
      questionCount,
      createdBy: req.user!.id,
      isPaid: isPaid || false,
    });

    return res.status(201).json({ success: true, quiz });
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * Get all quizzes with filters
 * GET /api/quizzes
 */
router.get('/', async (req: Request, res: Response): Promise<any> => {
  try {
    const {
      subject,
      semester,
      difficulty,
      isPaid,
      visibility,
      skip = 0,
      limit = 20,
    } = req.query;

    const quizzes = await QuizGenerationService.getQuizzes({
      subject: subject as string,
      semester: semester ? parseInt(semester as string) : undefined,
      difficulty: difficulty as string,
      isPaid: isPaid ? isPaid === 'true' : undefined,
      visibility: isPrivileged(req.user)
        ? visibility as 'public' | 'private' | 'draft'
        : 'public',
      skip: parseInt(skip as string),
      limit: parseInt(limit as string),
    });

    return res.json({ success: true, ...quizzes });
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * Get quiz details with questions
 * GET /api/quizzes/:quizId
 */
router.get('/:quizId', async (req: Request, res: Response): Promise<any> => {
  try {
    const { quizId } = req.params;

    const quiz = await QuizGenerationService.getQuizWithContent(quizId);
    if (!isPrivileged(req.user) && quiz.visibility !== 'public') {
      return res.status(403).json({ error: 'Quiz is not published' });
    }

    const responseQuiz = quiz.toObject();
    if (!isPrivileged(req.user)) {
      responseQuiz.questions = responseQuiz.questions.map((entry: any) => {
        if (entry.questionId && typeof entry.questionId === 'object') {
          delete entry.questionId.correctAnswer;
        }
        return entry;
      });
    }

    return res.json({ success: true, quiz: responseQuiz });
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * Update quiz
 * PATCH /api/quizzes/:quizId
 */
router.patch('/:quizId', requireRole('admin', 'instructor'), async (req: Request, res: Response): Promise<any> => {
  try {
    const { quizId } = req.params;
    const updates = req.body;

    const quiz = await QuizGenerationService.updateQuiz(quizId, updates);

    return res.json({ success: true, quiz });
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * Publish quiz (make public)
 * POST /api/quizzes/:quizId/publish
 */
router.post('/:quizId/publish', requireRole('admin', 'instructor'), async (req: Request, res: Response): Promise<any> => {
  try {
    const { quizId } = req.params;
    const { isPaid } = req.body;

    const quiz = await QuizGenerationService.publishQuiz(quizId, isPaid || false);

    return res.json({ success: true, message: 'Quiz published', quiz });
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * Delete quiz
 * DELETE /api/quizzes/:quizId
 */
router.delete('/:quizId', requireRole('admin', 'instructor'), async (req: Request, res: Response): Promise<any> => {
  try {
    const { quizId } = req.params;

    await Quiz.findByIdAndDelete(quizId);
    // Note: In production, you might want to also delete associated attempts

    return res.json({ success: true, message: 'Quiz deleted successfully' });
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
});

// ============================================================================
// QUIZ ATTEMPT ENDPOINTS (Student/User)
// ============================================================================

/**
 * Start a quiz attempt
 * POST /api/quizzes/:quizId/start
 */
router.post('/:quizId/start', async (req: Request, res: Response): Promise<any> => {
  try {
    const { quizId } = req.params;
    const attemptData = await QuizGenerationService.startQuizAttempt(quizId, req.user!.id);

    return res.status(201).json({ success: true, ...attemptData });
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * Submit answer for a question
 * POST /api/quizzes/attempts/:attemptId/answer
 */
router.post('/attempts/:attemptId/answer', async (req: Request, res: Response): Promise<any> => {
  try {
    const { attemptId } = req.params;
    if (!(await assertAttemptOwnership(req, res, attemptId))) return;
    const { questionId, selectedAnswer, timeSpent } = req.body;

    if (!questionId || !selectedAnswer) {
      return res.status(400).json({
        error: 'questionId and selectedAnswer are required',
      });
    }

    const result = await QuizGenerationService.submitAnswer(
      attemptId,
      questionId,
      selectedAnswer,
      timeSpent || 0
    );

    return res.json({ success: true, ...result });
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * Submit quiz (mark as complete)
 * POST /api/quizzes/attempts/:attemptId/submit
 */
router.post(
  '/attempts/:attemptId/submit',
  async (req: Request, res: Response): Promise<any> => {
    try {
      const { attemptId } = req.params;
      if (!(await assertAttemptOwnership(req, res, attemptId))) return;

      const result = await QuizGenerationService.submitQuiz(attemptId);

      return res.json({ success: true, ...result });
    } catch (error) {
      return res.status(500).json({ error: (error as Error).message });
    }
  }
);

/**
 * Get quiz results
 * GET /api/quizzes/attempts/:attemptId/results
 */
router.get(
  '/attempts/:attemptId/results',
  async (req: Request, res: Response): Promise<any> => {
    try {
      const { attemptId } = req.params;
      if (!(await assertAttemptOwnership(req, res, attemptId))) return;

      const results = await QuizGenerationService.getQuizResults(attemptId);

      return res.json({ success: true, results });
    } catch (error) {
      return res.status(500).json({ error: (error as Error).message });
    }
  }
);

/**
 * Get user's quiz attempts (history)
 * GET /api/quizzes/user/:userId/attempts
 */
router.get(
  '/user/:userId/attempts',
  async (req: Request, res: Response): Promise<any> => {
    try {
      const { quizId, skip, limit } = req.query;

      const result = await QuizGenerationService.getUserQuizAttempts(req.user!.id, {
        quizId: quizId as string,
        skip: skip ? parseInt(skip as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      });

      return res.json({ success: true, ...result });
    } catch (error) {
      return res.status(500).json({ error: (error as Error).message });
    }
  }
);

// ============================================================================
// STATISTICS ENDPOINTS
// ============================================================================

/**
 * Get quiz statistics
 * GET /api/quizzes/:quizId/stats
 */
router.get('/:quizId/stats', async (req: Request, res: Response): Promise<any> => {
  try {
    const { quizId } = req.params;

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    const attempts = await QuizAttempt.find({
      quizId,
      status: 'submitted',
    });

    const stats = {
      quiz: {
        _id: quiz._id,
        title: quiz.title,
        totalMarks: quiz.totalMarks,
      },
      totalAttempts: attempts.length,
      averageScore: attempts.length > 0
        ? (attempts.reduce((sum, a) => sum + a.totalScore, 0) / attempts.length).toFixed(2)
        : 0,
      averagePercentage: attempts.length > 0
        ? (attempts.reduce((sum, a) => sum + a.percentage, 0) / attempts.length).toFixed(2)
        : 0,
      highestScore: attempts.length > 0 ? Math.max(...attempts.map((a) => a.totalScore)) : 0,
      lowestScore: attempts.length > 0 ? Math.min(...attempts.map((a) => a.totalScore)) : 0,
      passPercentage:
        attempts.length > 0
          ? (
              (attempts.filter((a) => a.percentage >= 60).length /
                attempts.length) *
              100
            ).toFixed(2)
          : 0,
    };

    return res.json({ success: true, stats });
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
