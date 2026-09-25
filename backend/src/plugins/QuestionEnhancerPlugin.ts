import { BasePlugin } from './PluginInterface';
import { Question } from '../models/Question';

/**
 * Question Enhancer Plugin - Enhances questions with related content
 * Adds difficulty level, related cases, and suggested answers
 */
export class QuestionEnhancerPlugin extends BasePlugin {
  constructor() {
    super({
      name: 'Question Enhancer',
      version: '1.0.0',
      description: 'Enhances questions with difficulty analysis, related cases, and study recommendations',
      author: 'LLB Platform Team',
      enabled: true,
    });

    this.hooks = {
      onBeforeQuestionProcess: this.analyzeQuestion.bind(this),
    };
  }

  async initialize(): Promise<void> {
    await super.initialize();
    console.log('[QuestionEnhancerPlugin] Question enhancement system initialized');
  }

  /**
   * Analyze and enhance question with metadata
   */
  private async analyzeQuestion(question: any): Promise<any> {
    const analysis = {
      difficulty: this.calculateDifficulty(question.text),
      estimatedAnswerTime: this.estimateAnswerTime(question.type),
      keyTopics: this.extractKeyTopics(question.text),
      suggestedApproach: this.suggestAnswerApproach(question.type),
      relatedSections: this.findRelatedSections(question.text),
    };

    return {
      ...question,
      analysis,
      enhancedAt: new Date(),
    };
  }

  /**
   * Calculate question difficulty (Easy, Medium, Hard)
   */
  private calculateDifficulty(text: string): 'Easy' | 'Medium' | 'Hard' {
    const wordCount = text.split(/\s+/).length;
    const complexKeywords = ['analyse', 'distinguish', 'compare', 'critically', 'evaluate', 'elaborate'];
    const complexCount = complexKeywords.filter((kw) =>
      text.toLowerCase().includes(kw)
    ).length;

    if (complexCount >= 2 || wordCount > 50) {
      return 'Hard';
    } else if (complexCount === 1 || wordCount > 25) {
      return 'Medium';
    }
    return 'Easy';
  }

  /**
   * Estimate answer time based on question type
   */
  private estimateAnswerTime(type: string): { min: number; max: number } {
    const timeMap: any = {
      MCQ: { min: 1, max: 2 },
      SHORT: { min: 5, max: 10 },
      LONG: { min: 20, max: 30 },
      DESCRIPTIVE: { min: 30, max: 45 },
    };
    return timeMap[type] || { min: 10, max: 15 };
  }

  /**
   * Extract key topics from question
   */
  private extractKeyTopics(text: string): string[] {
    const topics: string[] = [];
    const lawConcepts = [
      'contract', 'tort', 'criminal', 'constitutional', 'property', 'family',
      'constitutional', 'procedure', 'evidence', 'intellectual property',
      'corporate', 'commercial', 'administrative', 'labour', 'environmental',
    ];

    lawConcepts.forEach((concept) => {
      if (text.toLowerCase().includes(concept)) {
        topics.push(concept.charAt(0).toUpperCase() + concept.slice(1));
      }
    });

    return [...new Set(topics)];
  }

  /**
   * Suggest answer approach based on question type
   */
  private suggestAnswerApproach(type: string): string {
    const approaches: any = {
      MCQ: 'Select the most appropriate option. Eliminate obviously wrong options first.',
      SHORT: 'Provide a concise answer with key points. Use bullet points if applicable.',
      LONG: 'Structure your answer with introduction, detailed explanation, and conclusion. Include case references.',
      DESCRIPTIVE: 'Write comprehensive answer with explanation, examples, case law, and critical analysis.',
    };
    return approaches[type] || 'Provide a clear and structured answer';
  }

  /**
   * Find related law sections
   */
  private findRelatedSections(text: string): string[] {
    const sections: string[] = [];
    const sectionPattern = /section\s+(\d+[A-Za-z]?)/gi;
    const matches = text.match(sectionPattern) || [];

    matches.forEach((match) => {
      sections.push(match);
    });

    return [...new Set(sections)];
  }

  /**
   * Execute custom actions
   */
  async execute(action: string, data: any): Promise<any> {
    switch (action) {
      case 'analyzeQuestion':
        return this.analyzeQuestion(data);

      case 'getSimilarQuestions':
        return this.findSimilarQuestions(data.questionId, data.limit || 5);

      case 'getStudyPlan':
        return this.generateStudyPlan(data.questionId);

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  /**
   * Find similar questions
   */
  private async findSimilarQuestions(questionId: string, limit: number): Promise<any[]> {
    try {
      const question = await Question.findById(questionId);
      if (!question) return [];

      const similar = await Question.find({
        _id: { $ne: questionId },
        subject: question.subject,
        semester: question.semester,
        type: question.type,
      }).limit(limit);

      return similar.map((q: any) => ({
        _id: q._id,
        text: q.text || q.question || '',
        similarity: 'high',
      }));
    } catch (error) {
      console.error('[QuestionEnhancerPlugin] Error finding similar questions:', error);
      return [];
    }
  }

  /**
   * Generate personalized study plan
   */
  private generateStudyPlan(_questionId: string): any {
    return {
      phase1: {
        title: 'Understand the Question',
        tasks: [
          'Read question carefully multiple times',
          'Identify key concepts and topics',
          'Understand what is being asked',
        ],
        duration: '5 minutes',
      },
      phase2: {
        title: 'Study Related Content',
        tasks: [
          'Review relevant law sections',
          'Read case law references',
          'Understand legal principles',
        ],
        duration: '15 minutes',
      },
      phase3: {
        title: 'Draft Answer',
        tasks: [
          'Outline main points',
          'Include relevant case references',
          'Structure with clear headings',
        ],
        duration: '10 minutes',
      },
      phase4: {
        title: 'Review & Refine',
        tasks: [
          'Check for completeness',
          'Verify legal accuracy',
          'Improve clarity and structure',
        ],
        duration: '5 minutes',
      },
    };
  }
}

export default QuestionEnhancerPlugin;
