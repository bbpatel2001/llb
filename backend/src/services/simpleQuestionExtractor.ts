/**
 * Simple Pattern-Based Question Extractor
 * Extracts questions from text using regex patterns
 * Fast, reliable, works offline
 */

export interface ExtractedQuestion {
  questionNumber: string;
  questionText: string;
  marks: number;
  type: 'SHORT' | 'LONG' | 'MCQ' | 'CASE_STUDY' | 'DESCRIPTIVE';
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  options?: Array<{ label: string; text: string }>;
  correctAnswer?: string;
}

export class SimpleQuestionExtractor {
  /**
   * Extract from raw text (use pdftotext or similar to convert PDF to text first)
   * pdftotext command: pdftotext input.pdf output.txt
   */
  static extractFromText(text: string): ExtractedQuestion[] {
    const questions: ExtractedQuestion[] = [];

    // Split by common question patterns
    const lines = text.split('\n').filter(l => l.trim().length > 0);

    let currentQuestion: Partial<ExtractedQuestion> = {};
    let currentText = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Skip common non-question lines
      if (this._isSkippable(line)) {
        continue;
      }

      // Check if this line starts a new question
      const qMatch = line.match(/^(\d+[a-z]*[\.\)]\s*)/i);
      if (qMatch) {
        // Save previous question if exists
        if (currentText.trim().length > 30) {
          const q = this._createQuestion(currentQuestion, currentText);
          if (q) questions.push(q);
        }

        // Start new question
        currentQuestion = {
          questionNumber: qMatch[1].trim(),
          type: 'LONG',
          difficulty: 'MEDIUM',
          marks: 25,
        };
        currentText = line.replace(qMatch[0], '').trim();
      } else if (
        currentQuestion.questionNumber &&
        !line.match(/^(Page|Answer|Instructions)/i)
      ) {
        // Continue current question
        currentText += ' ' + line;
      }
    }

    // Save last question
    if (currentText.trim().length > 30) {
      const q = this._createQuestion(currentQuestion, currentText);
      if (q) questions.push(q);
    }

    return this._deduplicateQuestions(questions);
  }

  /**
   * Create question from text
   */
  private static _createQuestion(
    base: Partial<ExtractedQuestion>,
    text: string
  ): ExtractedQuestion | null {
    if (!text || text.length < 20) return null;

    // Clean text
    let cleaned = text
      .replace(/www\.\S+|@\S+|instagram/gi, '')
      .replace(/JV-\d+|NP-\d+|Seat No\.:?\s*\w+/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

    // Extract marks if present
    const marksMatch = cleaned.match(/(\d{1,3})\s*(?:marks?|m)\s*$/i);
    let marks = 25;
    if (marksMatch) {
      marks = Math.min(100, Math.max(1, parseInt(marksMatch[1])));
      cleaned = cleaned
        .replace(marksMatch[0], '')
        .replace(/[\.\s]+$/, '')
        .trim();
    }

    // Determine type
    let type: 'SHORT' | 'LONG' | 'MCQ' | 'CASE_STUDY' | 'DESCRIPTIVE' = 'LONG';
    if (cleaned.length < 100) type = 'SHORT';
    if (cleaned.includes('(A)') || cleaned.includes('(a)')) type = 'MCQ';
    if (cleaned.length > 300) type = 'DESCRIPTIVE';

    // Determine difficulty from marks
    let difficulty: 'EASY' | 'MEDIUM' | 'HARD' = 'MEDIUM';
    if (marks <= 5) difficulty = 'EASY';
    if (marks >= 25) difficulty = 'HARD';

    return {
      questionNumber: base.questionNumber || '?',
      questionText: cleaned,
      marks,
      type,
      difficulty,
      options: undefined,
      correctAnswer: undefined,
    };
  }

  /**
   * Deduplicate questions
   */
  private static _deduplicateQuestions(
    questions: ExtractedQuestion[]
  ): ExtractedQuestion[] {
    const seen = new Map<string, ExtractedQuestion>();

    for (const q of questions) {
      const normalized = q.questionText
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');

      if (!seen.has(normalized)) {
        seen.set(normalized, q);
      }
    }

    return Array.from(seen.values());
  }

  /**
   * Check if line should be skipped
   */
  private static _isSkippable(line: string): boolean {
    const skipPatterns = [
      /^(Page|Instructions|Note|Time|Max|Marks|Answer|OR)[\s:]/i,
      /^(www|http|instagram|@|Seat No|Exam)/i,
      /^[\[\(\-]$/,
      /^[A-Za-z]{1,2}\.?$/,
    ];

    if (line.length < 5) return true;

    return skipPatterns.some(p => p.test(line));
  }
}
