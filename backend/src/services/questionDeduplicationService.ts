import { Question, IQuestion } from '../models/Question';

/**
 * Question Deduplication Service
 * Provides utilities to identify and prevent duplicate questions
 */

export class QuestionDeduplicationService {
  /**
   * Normalize question text to identify duplicates
   * Removes extraction artifacts like trailing marks, "OR", etc.
   */
  static normalizeQuestionText(text: string): string {
    if (!text) return '';

    const normalized = text
      // Remove leading question numbers (1., 2., etc.)
      .replace(/^\d+\.\s*/, '')
      // Remove trailing marks (e.g., " 20", " 25", " 100")
      .replace(/\s+\d+\s*$/, '')
      // Remove " OR" and everything after it (alternative questions)
      .replace(/\s+OR\s+.*$/, '')
      // Remove trailing punctuation followed by extraction artifacts
      .replace(/\.\s+\d+\s*([a-z]?)?\s*$/, '.')
      // Remove trailing single characters (extraction artifacts)
      .replace(/\s+[a-z]\s*$/, '')
      // Remove extra periods and spaces
      .replace(/\.+/g, '.')
      // Normalize whitespace
      .replace(/\s+/g, ' ')
      .trim();

    return normalized.toLowerCase();
  }

  /**
   * Check if a question is a duplicate of an existing one
   * Returns the existing question if duplicate found, null otherwise
   */
  static async findDuplicate(
    questionText: string,
    paperId?: string
  ): Promise<IQuestion | null> {
    const normalized = this.normalizeQuestionText(questionText);

    if (!normalized) return null;

    // Get all questions and compare normalized text
    const allQuestions = await Question.find();

    for (const existing of allQuestions) {
      if (this.normalizeQuestionText(existing.questionText) === normalized) {
        // Optional: only consider it a duplicate if from same paper
        if (paperId && existing.paperId.toString() !== paperId) {
          continue;
        }
        return existing;
      }
    }

    return null;
  }

  /**
   * Check if a question is a duplicate (optimized for batch operations)
   * Accepts a map of normalized texts for faster lookups
   */
  static async findDuplicateInBatch(
    questionText: string,
    normalizedMap: Map<string, IQuestion>
  ): Promise<IQuestion | null> {
    const normalized = this.normalizeQuestionText(questionText);

    if (!normalized) return null;

    return normalizedMap.get(normalized) || null;
  }

  /**
   * Get all existing normalized question texts for batch deduplication
   */
  static async getNormalizedQuestionMap(): Promise<Map<string, IQuestion>> {
    const allQuestions = await Question.find();
    const map = new Map<string, IQuestion>();

    for (const question of allQuestions) {
      const normalized = this.normalizeQuestionText(question.questionText);
      if (normalized && !map.has(normalized)) {
        map.set(normalized, question);
      }
    }

    return map;
  }

  /**
   * Find all duplicate groups in the database
   */
  static async findAllDuplicateGroups(): Promise<
    Array<{
      normalizedText: string;
      count: number;
      questions: IQuestion[];
    }>
  > {
    const allQuestions = await Question.find();
    const groups = new Map<
      string,
      { normalizedText: string; questions: IQuestion[] }
    >();

    for (const question of allQuestions) {
      const normalized = this.normalizeQuestionText(question.questionText);

      if (!groups.has(normalized)) {
        groups.set(normalized, {
          normalizedText: normalized,
          questions: [],
        });
      }

      groups.get(normalized)!.questions.push(question);
    }

    // Filter to only groups with duplicates and sort by count
    return Array.from(groups.values())
      .filter(group => group.questions.length > 1)
      .map(group => ({
        normalizedText: group.normalizedText,
        count: group.questions.length,
        questions: group.questions,
      }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Remove duplicate questions, keeping only the first occurrence
   * Returns the number of questions removed
   */
  static async removeDuplicates(): Promise<{
    duplicateGroupsFound: number;
    questionsRemoved: number;
    duplicateIds: string[];
  }> {
    const duplicates = await this.findAllDuplicateGroups();
    const removedIds: string[] = [];
    let totalRemoved = 0;

    for (const group of duplicates) {
      // Keep the first one, remove the rest
      const toRemove = group.questions.slice(1);

      for (const question of toRemove) {
        await Question.findByIdAndDelete(question._id);
        removedIds.push(question._id.toString());
        totalRemoved++;
      }
    }

    return {
      duplicateGroupsFound: duplicates.length,
      questionsRemoved: totalRemoved,
      duplicateIds: removedIds,
    };
  }

  /**
   * Clean question text for storage (remove extraction artifacts)
   */
  static cleanQuestionText(text: string): string {
    if (!text) return '';

    const cleaned = text
      // Remove leading patterns like "1. " or "Q1. "
      .replace(/^(Q|Question)?\s*\d+\.\s*/i, '')
      // Remove trailing marks in various formats
      .replace(/\s*[\[\(]?\s*\d+\s*(?:marks?|m|pts?)?\s*[\]\)]?\s*$/, '')
      // Remove " OR" sections (alternative questions)
      .replace(/\s*\bOR\b\s+[^]*$/, '')
      // Clean up excessive whitespace
      .replace(/\s+/g, ' ')
      .trim();

    return cleaned;
  }
}
