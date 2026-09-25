/**
 * Question Validation Service - Identify OBVIOUS garbage only
 * Keep all reasonable questions
 */

export interface ValidationResult {
  isValid: boolean;
  quality: number;
  issues: string[];
  score: {
    textQuality: number;
    completeness: number;
    coherence: number;
    formatValidity: number;
  };
}

export class QuestionValidationService {
  /**
   * Simple validation - only mark as garbage if OBVIOUSLY corrupted
   */
  static validateQuestion(text: string): ValidationResult {
    const score = {
      textQuality: 100,
      completeness: 100,
      coherence: 100,
      formatValidity: 100,
    };

    if (!text || text.trim().length < 10) {
      return {
        isValid: false,
        quality: 0,
        issues: ['Too short'],
        score: { ...score, textQuality: 0 },
      };
    }

    // Check 1: Heavy encoding corruption (mostly non-ASCII)
    const nonAscii = (text.match(/[^\x00-\x7F]/g) || []).length;
    if (nonAscii > text.length * 0.4) {
      return {
        isValid: false,
        quality: 10,
        issues: ['Encoding corruption'],
        score: { ...score, textQuality: 10 },
      };
    }

    // Check 2: Pure gibberish
    const garbageCount = (text.match(/(\w)\1{5,}/g) || []).length;
    if (garbageCount > 0) {
      return {
        isValid: false,
        quality: 15,
        issues: ['Gibberish (repeated chars)'],
        score: { ...score, textQuality: 15 },
      };
    }

    // Check 3: Cut off (ends with " OR")
    if (/\s+OR\s*$/i.test(text.trim())) {
      return {
        isValid: false,
        quality: 25,
        issues: ['Cut off (ends with OR)'],
        score: { ...score, completeness: 25 },
      };
    }

    // All else = valid
    return {
      isValid: true,
      quality: 90,
      issues: [],
      score,
    };
  }

  /**
   * Filter questions - keep most, only remove OBVIOUS garbage
   */
  static filterGarbageQuestions(questions: any[]): {
    valid: any[];
    invalid: Array<{ question: any; reason: ValidationResult }>;
  } {
    const valid: any[] = [];
    const invalid: Array<{ question: any; reason: ValidationResult }> = [];

    for (const q of questions) {
      const validation = this.validateQuestion(q.questionText);
      if (validation.isValid) {
        valid.push(q);
      } else {
        invalid.push({ question: q, reason: validation });
      }
    }

    return { valid, invalid };
  }
}
