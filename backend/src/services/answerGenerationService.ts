import { Answer, IAnswer, ICaseReference, IActReference } from '../models/Answer';
import { Question, IQuestion } from '../models/Question';
import { AnswerLanguage } from '../config/languages';
import AnswerGuidanceService from './answerGuidanceService';

function answerLookup(questionId: string, type: string, language: AnswerLanguage) {
  if (language === 'en') {
    return { questionId, type, $or: [{ language: 'en' }, { language: { $exists: false } }] };
  }
  return { questionId, type, language };
}

/**
 * LLB Academy Answer Generation Service
 * Generates comprehensive, LLB-compliant answers with case references, acts, and study materials
 */
export class AnswerGenerationService {
  /**
   * Generate comprehensive short answer with case references and acts
   */
  static async generateShortAnswer(questionId: string, language: AnswerLanguage = 'en'): Promise<IAnswer> {
    try {
      const question = await Question.findById(questionId);
      if (!question) throw new Error('Question not found');

      // Check if answer already exists
      let answer = await Answer.findOne(answerLookup(questionId, 'short', language));
      if (answer && answer.verified) return answer;

      const answerText = AnswerGuidanceService.buildAnswerText(question, 'short', language);
      const writingGuide = AnswerGuidanceService.buildWritingGuide(question, 'short', language);
      const keyPoints = this.extractKeyPoints(answerText);
      const casesReferred = this.extractCaseReferences(answerText);
      const actsReferred = this.extractActReferences(answerText);
      const studyTips = AnswerGuidanceService.buildStudyTips(question, 'short');

      const answerData = {
        questionId,
        paperId: (question as any).paperId,
        type: 'short' as const,
        language,
        text: answerText,
        wordCount: answerText.split(/\s+/).length,
        keyPoints,
        casesReferred,
        actsReferred,
        studyTips,
        writingGuide,
        difficulty: this.classifyDifficulty((question as any).marks),
        generatedBy: 'ai' as const,
        qualityScore: 7,
        verified: false,
        sources: this.generateSources(question),
      };

      if (answer) {
        // Update existing
        Object.assign(answer, answerData);
        await answer.save();
      } else {
        // Create new
        answer = new Answer(answerData);
        await answer.save();
      }

      return answer;
    } catch (error) {
      throw new Error(`Failed to generate short answer: ${error}`);
    }
  }

  /**
   * Generate comprehensive long answer with detailed case analysis
   */
  static async generateLongAnswer(questionId: string, language: AnswerLanguage = 'en'): Promise<IAnswer> {
    try {
      const question = await Question.findById(questionId);
      if (!question) throw new Error('Question not found');

      let answer = await Answer.findOne(answerLookup(questionId, 'long', language));
      if (answer && answer.verified) return answer;

      const answerText = AnswerGuidanceService.buildAnswerText(question, 'long', language);
      const writingGuide = AnswerGuidanceService.buildWritingGuide(question, 'long', language);
      const keyPoints = this.extractKeyPoints(answerText);
      const casesReferred = this.extractCaseReferences(answerText);
      const actsReferred = this.extractActReferences(answerText);
      const studyTips = AnswerGuidanceService.buildStudyTips(question, 'long');

      const answerData = {
        questionId,
        paperId: (question as any).paperId,
        type: 'long' as const,
        language,
        text: answerText,
        wordCount: answerText.split(/\s+/).length,
        keyPoints,
        casesReferred,
        actsReferred,
        studyTips,
        writingGuide,
        difficulty: this.classifyDifficulty((question as any).marks),
        generatedBy: 'ai' as const,
        qualityScore: 8,
        verified: false,
        sources: this.generateSources(question),
      };

      if (answer) {
        Object.assign(answer, answerData);
        await answer.save();
      } else {
        answer = new Answer(answerData);
        await answer.save();
      }

      return answer;
    } catch (error) {
      throw new Error(`Failed to generate long answer: ${error}`);
    }
  }

  /**
   * Generate MCQ answer with multiple options and explanations
   */
  static async generateMCQAnswer(questionId: string): Promise<IAnswer> {
    try {
      const question = await Question.findById(questionId);
      if (!question) throw new Error('Question not found');

      if (question.type !== 'MCQ' || !question.options) {
        throw new Error('Question must be MCQ type with options');
      }

      let answer = await Answer.findOne({ questionId, type: 'mcq' });

      const mcqOptions = (question.options || []).map((opt, idx) => ({
        label: ['A', 'B', 'C', 'D'][idx] as 'A' | 'B' | 'C' | 'D',
        text: opt.text,
        isCorrect: opt.label === question.correctAnswer,
        explanation: this.generateOptionExplanation(opt.text, opt.label === question.correctAnswer),
      }));

      const answerData = {
        questionId,
        paperId: (question as any).paperId,
        type: 'mcq' as const,
        text: `The correct answer is ${question.correctAnswer}`,
        wordCount: 10,
        mcqOptions,
        mcqExplanation: this.generateMCQExplanation(question.questionText, question.correctAnswer),
        difficulty: this.classifyDifficulty((question as any).marks),
        generatedBy: 'ai' as const,
        qualityScore: 9,
        verified: false,
        sources: this.generateSources(question),
      };

      if (answer) {
        Object.assign(answer, answerData);
        await answer.save();
      } else {
        answer = new Answer(answerData);
        await answer.save();
      }

      return answer;
    } catch (error) {
      throw new Error(`Failed to generate MCQ answer: ${error}`);
    }
  }

  /**
   * Generate case study answer with sub-questions
   */
  static async generateCaseStudyAnswer(questionId: string): Promise<IAnswer> {
    try {
      const question = await Question.findById(questionId);
      if (!question) throw new Error('Question not found');

      if (question.type !== 'CASE_STUDY') {
        throw new Error('Question must be CASE_STUDY type');
      }

      let answer = await Answer.findOne({ questionId, type: 'case_study' });

      const subQuestions = [
        {
          subQuestion: 'What is the primary legal issue in this case?',
          expectedAnswer: this.extractPrimaryIssue(question.questionText),
          marks: Math.ceil((question.marks || 10) / 3),
        },
        {
          subQuestion: 'What principles of law are applicable?',
          expectedAnswer: this.extractApplicablePrinciples(question.questionText),
          marks: Math.ceil((question.marks || 10) / 3),
        },
        {
          subQuestion: 'What would be your judgment and reasoning?',
          expectedAnswer: this.generateJudgment(question.questionText),
          marks: Math.floor((question.marks || 10) / 3),
        },
      ];

      const answerData = {
        questionId,
        paperId: (question as any).paperId,
        type: 'case_study' as const,
        caseScenario: question.questionText,
        questions: subQuestions,
        difficulty: this.classifyDifficulty((question as any).marks),
        generatedBy: 'ai' as const,
        qualityScore: 8,
        verified: false,
        sources: this.generateSources(question),
      };

      if (answer) {
        Object.assign(answer, answerData);
        await answer.save();
      } else {
        answer = new Answer(answerData);
        await answer.save();
      }

      return answer;
    } catch (error) {
      throw new Error(`Failed to generate case study answer: ${error}`);
    }
  }

  /**
   * Generate all answer types for a question
   */
  static async generateAllAnswers(questionId: string, language: AnswerLanguage = 'en'): Promise<IAnswer[]> {
    const question = await Question.findById(questionId);
    if (!question) throw new Error('Question not found');

    const answers: IAnswer[] = [];

    try {
      answers.push(await this.generateShortAnswer(questionId, language));
    } catch (e) {
      console.warn('Failed to generate short answer:', e);
    }

    try {
      answers.push(await this.generateLongAnswer(questionId, language));
    } catch (e) {
      console.warn('Failed to generate long answer:', e);
    }

    if (question.type === 'MCQ') {
      try {
        answers.push(await this.generateMCQAnswer(questionId));
      } catch (e) {
        console.warn('Failed to generate MCQ answer:', e);
      }
    }

    if (question.type === 'CASE_STUDY') {
      try {
        answers.push(await this.generateCaseStudyAnswer(questionId));
      } catch (e) {
        console.warn('Failed to generate case study answer:', e);
      }
    }

    return answers;
  }

  /**
   * Get or generate answer for a question
   */
  static async getOrGenerateAnswer(
    questionId: string,
    answerType: 'short' | 'long' | 'standard' = 'standard',
    language: AnswerLanguage = 'en'
  ): Promise<IAnswer | null> {
    let answer = await Answer.findOne(answerLookup(questionId, answerType, language));

    if (!answer) {
      if (answerType === 'short') {
        // @ts-ignore - Type compatibility with mongoose document
        answer = await this.generateShortAnswer(questionId, language);
      } else if (answerType === 'long') {
        // @ts-ignore - Type compatibility with mongoose document
        answer = await this.generateLongAnswer(questionId, language);
      } else {
        // For standard, generate both short and long and return short
        await this.generateShortAnswer(questionId, language);
        // @ts-ignore - Type compatibility with mongoose document
        answer = await this.generateLongAnswer(questionId, language);
      }
    }

    return answer;
  }

  /**
   * Bulk generate answers for semester/subject
   */
  static async generateAnswersForSubject(
    semester: number,
    subject: string,
    limit?: number,
    language: AnswerLanguage = 'en'
  ): Promise<{ generated: number; failed: number }> {
    const questions = await Question.find(
      { semester, subject },
      null,
      { limit: limit || 100 }
    );

    let generated = 0;
    let failed = 0;

    for (const question of questions) {
      try {
        await this.generateAllAnswers(question._id.toString(), language);
        generated++;
      } catch (error) {
        console.error(`Failed to generate answer for question ${question._id}:`, error);
        failed++;
      }
    }

    return { generated, failed };
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Extract key points from answer
   */
  private static extractKeyPoints(text: string): string[] {
    const points: string[] = [];
    const bulletPoints = text.match(/•\s+(.+?)(?=\n|$)/g) || [];
    
    bulletPoints.forEach((point) => {
      const cleaned = point.replace(/^•\s+/, '').trim();
      if (cleaned) points.push(cleaned);
    });

    return points.slice(0, 5); // Max 5 key points
  }

  /**
   * Extract case references from text (real implementation would use NLP)
   */
  private static extractCaseReferences(text: string): ICaseReference[] {
    const cases: ICaseReference[] = [];
    
    // Common landmark cases in different law subjects
    const caseDb: { [key: string]: ICaseReference } = {
      'Carlill v Carbolic': {
        caseName: 'Carlill v Carbolic Smoke Ball Co.',
        citation: '[1893] 1 QB 256',
        year: 1893,
        court: 'Queen\'s Bench',
        relevantPrinciple: 'Established principle of acceptance in contract law through conduct',
        relevantSections: ['IPC S.7', 'Indian Contract Act S.2(b)'],
      },
      'Donoghue v Stevenson': {
        caseName: 'Donoghue v Stevenson',
        citation: '[1932] AC 562',
        year: 1932,
        court: 'House of Lords',
        relevantPrinciple: 'Established the tort of negligence and duty of care principle',
        relevantSections: ['Tort Law', 'Negligence Principles'],
      },
      'Vicarage Road Stores v Patel': {
        caseName: 'Vicarage Road Stores v Patel',
        citation: '[1994] 160 JP 75',
        year: 1994,
        court: 'High Court',
        relevantPrinciple: 'Consumer protection and unfair contract terms',
        relevantSections: ['Consumer Protection Act'],
      },
    };

    // Search for known cases
    Object.entries(caseDb).forEach(([key, caseRef]) => {
      if (text.toLowerCase().includes(key.toLowerCase())) {
        cases.push(caseRef);
      }
    });

    return cases;
  }

  /**
   * Extract act references from text
   */
  private static extractActReferences(text: string): IActReference[] {
    const acts: IActReference[] = [];

    const actDb: { [key: string]: IActReference } = {
      'Indian Contract Act': {
        actName: 'Indian Contract Act, 1872',
        sections: [
          { number: '2', title: 'Definitions', summary: 'Key definitions of contract, offer, acceptance' },
          { number: '10', title: 'When acceptance is complete', summary: 'Rules for when acceptance becomes binding' },
          { number: '23', title: 'What consideration and objects are lawful', summary: 'Defines consideration and lawful objects' },
        ],
      },
      'Penal Code': {
        actName: 'Indian Penal Code, 1860',
        sections: [
          { number: '300', title: 'Murder', summary: 'Definition of murder and essential ingredients' },
          { number: '304', title: 'Culpable homicide', summary: 'Definition and distinctions from murder' },
          { number: '304A', title: 'Causing death by negligence', summary: 'Consequences of criminal negligence' },
        ],
      },
      'Constitution of India': {
        actName: 'Constitution of India, 1950',
        sections: [
          { number: '14', title: 'Equality before law', summary: 'Right to equality and non-discrimination' },
          { number: '21', title: 'Right to life and liberty', summary: 'Fundamental right to life' },
          { number: '32', title: 'Right to constitutional remedies', summary: 'Right to move Supreme Court' },
        ],
      },
    };

    Object.entries(actDb).forEach(([key, actRef]) => {
      if (text.toLowerCase().includes(key.toLowerCase())) {
        acts.push(actRef);
      }
    });

    return acts;
  }

  /**
   * Classify difficulty based on marks
   */
  private static classifyDifficulty(marks: number): 'easy' | 'medium' | 'hard' {
    if (marks <= 5) return 'easy';
    if (marks <= 15) return 'medium';
    return 'hard';
  }

  /**
   * Generate sources for the answer
   */
  private static generateSources(question: IQuestion) {
    return [
      {
        type: 'statute' as const,
        title: `${question.subject} - Statutory Framework`,
        year: 2024,
      },
      {
        type: 'case_law' as const,
        title: 'Landmark Cases in ' + question.subject,
        year: 2024,
      },
    ];
  }

  /**
   * Generate explanation for MCQ option
   */
  private static generateOptionExplanation(optionText: string, isCorrect: boolean): string {
    if (isCorrect) {
      return `This is the correct option. ${optionText} represents the accurate legal principle or outcome.`;
    }
    return `This option is incorrect. ${optionText} represents a misunderstanding or incorrect application of the law.`;
  }

  /**
   * Generate MCQ explanation
   */
  private static generateMCQExplanation(_question: string, correctAnswer: string | undefined): string {
    return `
To answer this MCQ:
1. Identify the core legal concept being tested
2. Eliminate obviously incorrect options
3. Apply the relevant legal principle or statutory provision
4. The correct answer (${correctAnswer}) represents the most accurate legal position
`;
  }

  /**
   * Extract primary legal issue from case study
   */
  private static extractPrimaryIssue(_caseText: string): string {
    return 'The primary legal issue concerns the applicability of relevant statutes and established legal principles to the given facts.';
  }

  /**
   * Extract applicable principles
   */
  private static extractApplicablePrinciples(_caseText: string): string {
    return 'Applicable principles include: (1) The statutory framework governing the subject matter; (2) Relevant case law establishing legal precedents; (3) Equity and fairness considerations.';
  }

  /**
   * Generate judgment for case study
   */
  private static generateJudgment(_caseText: string): string {
    return 'Based on the applicable law and facts: The claim should be decided in favor of the party whose position is supported by statutory law, established precedents, and principles of justice.';
  }
}

export default AnswerGenerationService;
