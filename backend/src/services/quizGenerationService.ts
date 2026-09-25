import { Quiz, QuizAttempt, IQuiz } from '../models/Quiz';
import { Question, IQuestion } from '../models/Question';

/**
 * Quiz Generation Service
 * Allows admins to create quizzes with MCQ and problem-based questions
 * Supports both free and paid content
 */
export class QuizGenerationService {
  /**
   * Create a new quiz with selected questions
   */
  static async createQuiz(data: {
    title: string;
    description: string;
    subject: string;
    semester: number;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    questionIds: string[];
    createdBy: string;
    isPaid: boolean;
    tags?: string[];
    visibility?: 'public' | 'private' | 'draft';
  }): Promise<IQuiz> {
    try {
      // Fetch questions and calculate total marks
      const questions = await Question.find({
        _id: { $in: data.questionIds },
      });

      if (questions.length === 0) {
        throw new Error('No questions found with provided IDs');
      }

      const quizQuestions = questions.map((q, idx) => ({
        questionId: q._id as any,
        marks: q.marks || 10,
        order: idx + 1,
      }));

      const totalMarks = quizQuestions.reduce((sum, q) => sum + q.marks, 0);
      const duration = Math.ceil((questions.length * 1.5) / 60); // 1.5 min per question average

      const quiz = new Quiz({
        title: data.title,
        description: data.description,
        subject: data.subject,
        semester: data.semester,
        difficulty: data.difficulty,
        totalMarks,
        duration,
        questions: quizQuestions,
        createdBy: data.createdBy,
        isPaid: data.isPaid,
        tags: data.tags || [],
        visibility: data.visibility || 'draft',
        statistics: {
          totalAttempts: 0,
          averageScore: 0,
          averageTime: duration * 60,
        },
      });

      await quiz.save();
      return quiz;
    } catch (error) {
      throw new Error(`Failed to create quiz: ${error}`);
    }
  }

  /**
   * Auto-generate quiz from questions based on difficulty and distribution
   */
  static async generateAutoQuiz(data: {
    title: string;
    subject: string;
    semester: number;
    totalQuestions: number;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    createdBy: string;
    isPaid?: boolean;
    targetMarks?: number;
  }): Promise<IQuiz> {
    try {
      const difficultyMap = {
        beginner: ['EASY', 'EASY', 'MEDIUM'],
        intermediate: ['EASY', 'MEDIUM', 'MEDIUM', 'HARD'],
        advanced: ['MEDIUM', 'HARD', 'HARD'],
      };

      const difficulties = difficultyMap[data.difficulty];
      const selectedQuestions: IQuestion[] = [];
      let currentMarks = 0;
      const targetMarks = data.targetMarks || 100;

      // Select questions in rotating difficulty order
      for (let i = 0; i < data.totalQuestions; i++) {
        const difficulty = difficulties[i % difficulties.length];

        const question = await Question.findOne({
          subject: data.subject,
          semester: data.semester,
          difficulty,
          marks: { $lte: targetMarks - currentMarks },
        });

        if (question) {
          selectedQuestions.push(question);
          currentMarks += question.marks || 10;
        }

        if (currentMarks >= targetMarks) break;
      }

      if (selectedQuestions.length === 0) {
        throw new Error('Not enough questions available for quiz generation');
      }

      const quizData = {
        title: data.title || `${data.subject} - ${data.difficulty} Quiz`,
        subject: data.subject,
        semester: data.semester,
        difficulty: data.difficulty,
        createdBy: data.createdBy,
        isPaid: data.isPaid || false,
        questionIds: selectedQuestions.map((q) => q._id.toString()),
        description: `Auto-generated ${data.difficulty} level quiz for ${data.subject}`,
      };

      return this.createQuiz(quizData);
    } catch (error) {
      throw new Error(`Failed to auto-generate quiz: ${error}`);
    }
  }

  /**
   * Generate MCQ-only quiz
   */
  static async generateMCQQuiz(data: {
    title: string;
    subject: string;
    semester: number;
    questionCount: number;
    createdBy: string;
    isPaid?: boolean;
  }): Promise<IQuiz> {
    try {
      const mcqQuestions = await Question.find({
        subject: data.subject,
        semester: data.semester,
        type: 'MCQ',
      }).limit(data.questionCount);

      if (mcqQuestions.length === 0) {
        throw new Error('No MCQ questions found for this subject');
      }

      const quizData = {
        title: data.title || `${data.subject} - MCQ Quiz`,
        subject: data.subject,
        semester: data.semester,
        difficulty: 'intermediate' as const,
        createdBy: data.createdBy,
        isPaid: data.isPaid || false,
        questionIds: mcqQuestions.map((q) => q._id.toString()),
        description: `Multiple Choice Quiz on ${data.subject}`,
      };

      return this.createQuiz(quizData);
    } catch (error) {
      throw new Error(`Failed to generate MCQ quiz: ${error}`);
    }
  }

  /**
   * Get quiz with populated questions and answers
   */
  static async getQuizWithContent(quizId: string) {
    try {
      const quiz = await Quiz.findById(quizId).populate(
        'questions.questionId'
      );

      if (!quiz) throw new Error('Quiz not found');

      return quiz;
    } catch (error) {
      throw new Error(`Failed to get quiz: ${error}`);
    }
  }

  /**
   * Update quiz
   */
  static async updateQuiz(
    quizId: string,
    data: Partial<{
      title: string;
      description: string;
      difficulty: 'beginner' | 'intermediate' | 'advanced';
      isPaid: boolean;
      visibility: 'public' | 'private' | 'draft';
      tags: string[];
    }>
  ): Promise<IQuiz> {
    try {
      const quiz = await Quiz.findByIdAndUpdate(quizId, data, {
        new: true,
      });

      if (!quiz) throw new Error('Quiz not found');

      return quiz;
    } catch (error) {
      throw new Error(`Failed to update quiz: ${error}`);
    }
  }

  /**
   * Publish quiz (make it public)
   */
  static async publishQuiz(quizId: string, isPaid: boolean = false): Promise<IQuiz> {
    return this.updateQuiz(quizId, {
      visibility: 'public',
      isPaid,
    });
  }

  /**
   * Get all quizzes with filters
   */
  static async getQuizzes(filters: {
    subject?: string;
    semester?: number;
    difficulty?: string;
    isPaid?: boolean;
    visibility?: 'public' | 'private' | 'draft';
    createdBy?: string;
    skip?: number;
    limit?: number;
  }) {
    try {
      const query: any = {};

      if (filters.subject) query.subject = filters.subject;
      if (filters.semester) query.semester = filters.semester;
      if (filters.difficulty) query.difficulty = filters.difficulty;
      if (filters.isPaid !== undefined) query.isPaid = filters.isPaid;
      if (filters.visibility) query.visibility = filters.visibility;
      if (filters.createdBy) query.createdBy = filters.createdBy;

      const skip = filters.skip || 0;
      const limit = filters.limit || 20;

      const [quizzes, total] = await Promise.all([
        Quiz.find(query)
          .skip(skip)
          .limit(limit)
          .sort({ createdAt: -1 }),
        Quiz.countDocuments(query),
      ]);

      return { quizzes, total };
    } catch (error) {
      throw new Error(`Failed to get quizzes: ${error}`);
    }
  }

  /**
   * Start quiz attempt
   */
  static async startQuizAttempt(quizId: string, userId: string) {
    try {
      const quiz = await Quiz.findById(quizId);
      if (!quiz) throw new Error('Quiz not found');

      const attempt = new QuizAttempt({
        quizId,
        userId,
        totalMarks: quiz.totalMarks,
        answers: [],
      });

      await attempt.save();

      return {
        attemptId: attempt._id,
        quiz,
        startTime: attempt.startedAt,
        duration: quiz.duration,
      };
    } catch (error) {
      throw new Error(`Failed to start quiz attempt: ${error}`);
    }
  }

  /**
   * Submit answer for a question in quiz
   */
  static async submitAnswer(
    attemptId: string,
    questionId: string,
    selectedAnswer: string,
    timeSpent: number
  ) {
    try {
      const attempt = await QuizAttempt.findById(attemptId);
      if (!attempt) throw new Error('Attempt not found');
      if (attempt.status !== 'in_progress') throw new Error('Attempt is already submitted');

      const quiz = await Quiz.findById(attempt.quizId).lean();
      if (!quiz || !quiz.questions.some((entry) => entry.questionId.toString() === questionId)) {
        throw new Error('Question is not part of this quiz');
      }
      if (attempt.answers.some((answer) => answer.questionId.toString() === questionId)) {
        throw new Error('Question has already been answered');
      }

      const question = await Question.findById(questionId);
      if (!question) throw new Error('Question not found');

      const isCorrect = selectedAnswer === question.correctAnswer;
      const marksObtained = isCorrect ? (question.marks || 10) : 0;

      attempt.answers.push({
        questionId: questionId as any,
        selectedAnswer,
        isCorrect,
        marksObtained,
        timeSpent,
      });

      await attempt.save();

      return {
        isCorrect,
        marksObtained,
      };
    } catch (error) {
      throw new Error(`Failed to submit answer: ${error}`);
    }
  }

  /**
   * Submit quiz (mark as complete)
   */
  static async submitQuiz(attemptId: string) {
    try {
      const attempt = await QuizAttempt.findById(attemptId);
      if (!attempt) throw new Error('Attempt not found');

      // Calculate total score and percentage
      const totalScore = attempt.answers.reduce(
        (sum, ans) => sum + (ans.marksObtained || 0),
        0
      );
      const percentage = (totalScore / attempt.totalMarks) * 100;
      const totalTime = attempt.answers.reduce((sum, ans) => sum + (ans.timeSpent || 0), 0);

      attempt.totalScore = totalScore;
      attempt.percentage = percentage;
      attempt.status = 'submitted';
      attempt.submittedAt = new Date();

      // Generate feedback
      attempt.feedback = this.generateQuizFeedback(
        totalScore,
        attempt.totalMarks,
        percentage
      );

      await attempt.save();

      // Update quiz statistics
      await this.updateQuizStatistics(attempt.quizId);

      return {
        score: totalScore,
        totalMarks: attempt.totalMarks,
        percentage: percentage.toFixed(2),
        feedback: attempt.feedback,
        totalTime: Math.round(totalTime / 60), // in seconds
        correctAnswers: attempt.answers.filter((a) => a.isCorrect).length,
        totalQuestions: attempt.answers.length,
      };
    } catch (error) {
      throw new Error(`Failed to submit quiz: ${error}`);
    }
  }

  /**
   * Get quiz results
   */
  static async getQuizResults(attemptId: string) {
    try {
      const attempt = await QuizAttempt.findById(attemptId).populate(
        'quizId'
      );

      if (!attempt) throw new Error('Attempt not found');

      const detailedAnswers = await Promise.all(
        attempt.answers.map(async (ans) => {
          const question = await Question.findById(ans.questionId);
          return {
            questionId: ans.questionId,
            questionText: question?.questionText,
            selectedAnswer: ans.selectedAnswer,
            correctAnswer: question?.correctAnswer,
            isCorrect: ans.isCorrect,
            marksObtained: ans.marksObtained,
            totalMarks: question?.marks,
          };
        })
      );

      return {
        attemptId: attempt._id,
        quiz: attempt.quizId,
        userId: attempt.userId,
        totalScore: attempt.totalScore,
        totalMarks: attempt.totalMarks,
        percentage: attempt.percentage,
        status: attempt.status,
        startedAt: attempt.startedAt,
        submittedAt: attempt.submittedAt,
        feedback: attempt.feedback,
        answers: detailedAnswers,
      };
    } catch (error) {
      throw new Error(`Failed to get quiz results: ${error}`);
    }
  }

  /**
   * Get user's quiz attempts (history)
   */
  static async getUserQuizAttempts(userId: string, filters?: {
    quizId?: string;
    skip?: number;
    limit?: number;
  }) {
    try {
      const query: any = { userId };
      if (filters?.quizId) query.quizId = filters.quizId;

      const skip = filters?.skip || 0;
      const limit = filters?.limit || 10;

      const [attempts, total] = await Promise.all([
        QuizAttempt.find(query)
          .populate('quizId')
          .skip(skip)
          .limit(limit)
          .sort({ submittedAt: -1 }),
        QuizAttempt.countDocuments(query),
      ]);

      return {
        attempts: attempts.map((a) => ({
          attemptId: a._id,
          quiz: a.quizId,
          totalScore: a.totalScore,
          totalMarks: a.totalMarks,
          percentage: a.percentage,
          status: a.status,
          submittedAt: a.submittedAt,
        })),
        total,
      };
    } catch (error) {
      throw new Error(`Failed to get user attempts: ${error}`);
    }
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Generate feedback based on score
   */
  private static generateQuizFeedback(
    _score: number,
    _totalMarks: number,
    percentage: number
  ): string {
    if (percentage >= 90) {
      return '🌟 Excellent! Your understanding of the topic is exceptional. Keep up the great work!';
    } else if (percentage >= 75) {
      return '✅ Good! You have a solid understanding. Review the topics where you lost marks for improvement.';
    } else if (percentage >= 60) {
      return '📚 Fair! You have the basics down. Focus on the areas where you made mistakes and practice more.';
    } else if (percentage >= 50) {
      return '⚠️ Below Average. Review the key concepts and practice similar questions.';
    } else {
      return '❌ Needs Improvement. Go back and study the topics thoroughly before retaking the quiz.';
    }
  }

  /**
   * Update quiz statistics
   */
  private static async updateQuizStatistics(quizId: any) {
    try {
      const attempts = await QuizAttempt.find({
        quizId,
        status: 'submitted',
      });

      if (attempts.length === 0) return;

      const totalAttempts = attempts.length;
      const averageScore =
        attempts.reduce((sum, a) => sum + a.totalScore, 0) / totalAttempts;
      const averageTime =
        attempts.reduce((sum, a) => {
          const time = a.answers.reduce((s, ans) => s + (ans.timeSpent || 0), 0);
          return sum + time;
        }, 0) / totalAttempts;

      await Quiz.findByIdAndUpdate(quizId, {
        'statistics.totalAttempts': totalAttempts,
        'statistics.averageScore': averageScore,
        'statistics.averageTime': averageTime,
      });
    } catch (error) {
      console.error('Failed to update quiz statistics:', error);
    }
  }
}

export default QuizGenerationService;
