import { Question, IQuestion } from '../models/Question';

/**
 * Question Service - Handle question extraction and retrieval
 */

export class QuestionService {
  /**
   * Get questions by semester
   */
  static async getQuestionsBySemester(
    semester: number,
    options: {
      subject?: string;
      type?: string;
      difficulty?: string;
      skip?: number;
      limit?: number;
    } = {}
  ): Promise<{ questions: IQuestion[]; total: number }> {
    const query: any = { semester };
    
    if (options.subject) {
      query.subject = options.subject.toUpperCase();
    }
    if (options.type) {
      query.type = options.type.toUpperCase();
    }
    if (options.difficulty) {
      query.difficulty = options.difficulty.toUpperCase();
    }

    const skip = options.skip || 0;
    const limit = options.limit || 50;

    const [questions, total] = await Promise.all([
      Question.find(query)
        .skip(skip)
        .limit(limit)
        .sort({ questionNumber: 1 }),
      Question.countDocuments(query),
    ]);

    return { questions, total };
  }

  /**
   * Get questions by paper
   */
  static async getQuestionsByPaper(
    paperId: string,
    options: { skip?: number; limit?: number } = {}
  ): Promise<{ questions: IQuestion[]; total: number }> {
    const skip = options.skip || 0;
    const limit = options.limit || 100;

    const [questions, total] = await Promise.all([
      Question.find({ paperId })
        .skip(skip)
        .limit(limit)
        .sort({ questionNumber: 1 }),
      Question.countDocuments({ paperId }),
    ]);

    return { questions, total };
  }

  /**
   * Get questions by subject
   */
  static async getQuestionsBySubject(
    subject: string,
    options: {
      semester?: number;
      type?: string;
      skip?: number;
      limit?: number;
    } = {}
  ): Promise<{ questions: IQuestion[]; total: number }> {
    const query: any = { subject: subject.toUpperCase() };

    if (options.semester) {
      query.semester = options.semester;
    }
    if (options.type) {
      query.type = options.type.toUpperCase();
    }

    const skip = options.skip || 0;
    const limit = options.limit || 50;

    const [questions, total] = await Promise.all([
      Question.find(query)
        .skip(skip)
        .limit(limit)
        .sort({ semester: 1, questionNumber: 1 }),
      Question.countDocuments(query),
    ]);

    return { questions, total };
  }

  /**
   * Search questions by text
   */
  static async searchQuestions(
    searchText: string,
    options: {
      semester?: number;
      subject?: string;
      skip?: number;
      limit?: number;
    } = {}
  ): Promise<{ questions: IQuestion[]; total: number }> {
    const query: any = {
      $text: { $search: searchText },
    };

    if (options.semester) {
      query.semester = options.semester;
    }
    if (options.subject) {
      query.subject = options.subject.toUpperCase();
    }

    const skip = options.skip || 0;
    const limit = options.limit || 30;

    const [questions, total] = await Promise.all([
      Question.find(query)
        .skip(skip)
        .limit(limit)
        .sort({ score: { $meta: 'textScore' } }),
      Question.countDocuments(query),
    ]);

    return { questions, total };
  }

  /**
   * Get question by ID
   */
  static async getQuestion(questionId: string): Promise<IQuestion | null> {
    return Question.findById(questionId).populate('paperId');
  }

  /**
   * Get questions by type
   */
  static async getQuestionsByType(
    type: string,
    options: {
      semester?: number;
      subject?: string;
      skip?: number;
      limit?: number;
    } = {}
  ): Promise<{ questions: IQuestion[]; total: number }> {
    const query: any = { type: type.toUpperCase() };

    if (options.semester) {
      query.semester = options.semester;
    }
    if (options.subject) {
      query.subject = options.subject.toUpperCase();
    }

    const skip = options.skip || 0;
    const limit = options.limit || 50;

    const [questions, total] = await Promise.all([
      Question.find(query)
        .skip(skip)
        .limit(limit),
      Question.countDocuments(query),
    ]);

    return { questions, total };
  }

  /**
   * Get statistics
   */
  static async getStatistics(): Promise<{
    totalQuestions: number;
    byType: any;
    byDifficulty: any;
    bySemester: any;
    bySubject: any;
  }> {
    const totalQuestions = await Question.countDocuments();

    const [byType, byDifficulty, bySemester, bySubject] = await Promise.all([
      Question.aggregate([
        { $group: { _id: '$type', count: { $sum: 1 } } },
      ]),
      Question.aggregate([
        { $group: { _id: '$difficulty', count: { $sum: 1 } } },
      ]),
      Question.aggregate([
        { $group: { _id: '$semester', count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Question.aggregate([
        { $group: { _id: '$subject', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    return {
      totalQuestions,
      byType: Object.fromEntries(byType.map(x => [x._id, x.count])),
      byDifficulty: Object.fromEntries(byDifficulty.map(x => [x._id, x.count])),
      bySemester: Object.fromEntries(bySemester.map(x => [x._id, x.count])),
      bySubject: Object.fromEntries(bySubject.map(x => [x._id, x.count])),
    };
  }

  /**
   * Get questions for study mode
   */
  static async getStudyQuestions(
    semester: number,
    subject: string,
    limit: number = 20
  ): Promise<IQuestion[]> {
    // Randomize questions for study
    return Question.find({
      semester,
      subject: subject.toUpperCase(),
    })
      .limit(limit)
      .exec();
  }

  /**
   * Get practice test questions
   */
  static async getPracticeTestQuestions(
    semester: number,
    subject?: string,
    totalMarks: number = 100
  ): Promise<IQuestion[]> {
    const query: any = { semester };
    if (subject) {
      query.subject = subject.toUpperCase();
    }

    // Get questions distributed by difficulty
    const questions: IQuestion[] = [];
    let currentMarks = 0;

    // Get 40% easy, 40% medium, 20% hard
    const difficulties = ['EASY', 'EASY', 'MEDIUM', 'MEDIUM', 'HARD'];

    for (const difficulty of difficulties) {
      if (currentMarks >= totalMarks) break;

      const remaining = totalMarks - currentMarks;
      const q = await Question.findOne({
        ...query,
        difficulty,
        marks: { $lte: remaining },
      });

      if (q) {
        questions.push(q);
        currentMarks += q.marks;
      }
    }

    return questions;
  }

  /**
   * Store extracted questions
   */
  static async storeExtractedQuestions(
    paperId: string,
    semester: number,
    subject: string,
    questions: any[]
  ): Promise<void> {
    const { QuestionDeduplicationService } = await import('./questionDeduplicationService');

    // Get map of existing questions for efficient deduplication
    const existingMap = await QuestionDeduplicationService.getNormalizedQuestionMap();

    const processedQuestions = [];
    const skipped = [];

    for (const q of questions) {
      // Check if this is a duplicate
      const duplicate = await QuestionDeduplicationService.findDuplicateInBatch(
        q.questionText,
        existingMap
      );

      if (duplicate) {
        skipped.push({
          questionText: q.questionText,
          duplicateOf: duplicate.questionText,
        });
        continue;
      }

      processedQuestions.push({
        ...q,
        paperId,
        semester,
        subject,
        extractionQuality: 100,
      });

      // Add to map for future checks in this batch
      const normalized = QuestionDeduplicationService.normalizeQuestionText(q.questionText);
      if (normalized) {
        existingMap.set(normalized, { questionText: q.questionText } as any);
      }
    }

    if (processedQuestions.length > 0) {
      await Question.insertMany(processedQuestions);
    }

    if (skipped.length > 0) {
      console.log(`Skipped ${skipped.length} duplicate questions during extraction`);
    }
  }

  /**
   * Get all subjects
   */
  static async getAllSubjects(): Promise<string[]> {
    const subjects = await Question.distinct('subject');
    return subjects.sort();
  }

  /**
   * Get related questions
   */
  static async getRelatedQuestions(
    questionId: string,
    limit: number = 5
  ): Promise<IQuestion[]> {
    const question = await Question.findById(questionId);
    if (!question) return [];

    return Question.find({
      _id: { $ne: questionId },
      subject: question.subject,
      semester: question.semester,
      type: question.type,
    })
      .limit(limit);
  }
}
