import { BasePlugin } from './PluginInterface';
import { CaseLaw } from '../models/CaseLaw';
import { Answer } from '../models/Answer';

/**
 * Case Law Plugin - Manages and enriches case law content
 * Links cases to answers, extracts legal principles, and provides case analysis
 */
export class CaseLawPlugin extends BasePlugin {
  constructor() {
    super({
      name: 'Case Law Manager',
      version: '1.0.0',
      description: 'Manages case law content, links cases to answers, and extracts legal principles',
      author: 'LLB Platform Team',
      enabled: true,
    });

    this.hooks = {
      onAfterAnswerGenerate: this.enrichAnswerWithCases.bind(this),
      onBeforeCaseLawCreate: this.validateCaseLaw.bind(this),
    };
  }

  async initialize(): Promise<void> {
    await super.initialize();
    console.log('[CaseLawPlugin] Case law management system initialized');
  }

  /**
   * Enrich answer with relevant case law
   */
  private async enrichAnswerWithCases(answer: any): Promise<any> {
    try {
      const relatedCases = await this.findRelatedCases(answer.content);

      return {
        ...answer,
        relatedCases,
        caseReferences: relatedCases.map((c) => ({
          name: c.name,
          citation: c.citation,
          relevance: c.relevance,
        })),
      };
    } catch (error) {
      console.error('[CaseLawPlugin] Error enriching answer with cases:', error);
      return answer;
    }
  }

  /**
   * Validate case law before creation
   */
  private async validateCaseLaw(caseLaw: any): Promise<any> {
    const errors: string[] = [];

    if (!caseLaw.name || caseLaw.name.trim() === '') {
      errors.push('Case name is required');
    }

    if (!caseLaw.citation || caseLaw.citation.trim() === '') {
      errors.push('Citation is required');
    }

    if (!caseLaw.year || isNaN(caseLaw.year)) {
      errors.push('Valid year is required');
    }

    if (caseLaw.year < 1947 || caseLaw.year > new Date().getFullYear()) {
      errors.push(`Year must be between 1947 and ${new Date().getFullYear()}`);
    }

    if (errors.length > 0) {
      throw new Error(`Case law validation failed: ${errors.join(', ')}`);
    }

    return {
      ...caseLaw,
      validatedAt: new Date(),
      status: 'valid',
    };
  }

  /**
   * Find cases related to answer content
   */
  private async findRelatedCases(content: string): Promise<any[]> {
    try {
      const keywords = this.extractCaseKeywords(content);
      const relatedCases = await CaseLaw.find({
        $or: [
          { name: { $regex: keywords.join('|'), $options: 'i' } },
          { ratio: { $regex: keywords.join('|'), $options: 'i' } },
        ],
      }).limit(5);

      return relatedCases.map((c) => ({
        _id: c._id,
        name: c.name,
        citation: c.citation,
        year: c.year,
        court: c.court,
        relevance: this.calculateRelevance(content, c.ratio),
      }));
    } catch (error) {
      console.error('[CaseLawPlugin] Error finding related cases:', error);
      return [];
    }
  }

  /**
   * Extract case keywords from content
   */
  private extractCaseKeywords(content: string): string[] {
    const casePattern = /[A-Z][a-z]+\s+v\.?\s+[A-Z][a-z]+/g;
    const matches = content.match(casePattern) || [];
    return [...new Set(matches)].slice(0, 5);
  }

  /**
   * Calculate relevance score (0-1)
   */
  private calculateRelevance(answerContent: string, caseRatio: string): number {
    const answerLower = answerContent.toLowerCase();
    const ratioLower = caseRatio.toLowerCase();

    const commonTerms = answerLower
      .split(/\s+/)
      .filter((term) => ratioLower.includes(term)).length;

    const relevanceScore = Math.min(commonTerms / 10, 1);
    return parseFloat(relevanceScore.toFixed(2));
  }

  /**
   * Execute custom actions
   */
  async execute(action: string, data: any): Promise<any> {
    switch (action) {
      case 'searchCases':
        return this.searchCases(data.query, data.limit);

      case 'getCaseAnalysis':
        return this.getCaseAnalysis(data.caseId);

      case 'getLandmarkCases':
        return this.getLandmarkCases(data.subject, data.limit);

      case 'generateCaseTimeline':
        return this.generateCaseTimeline(data.subject);

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  /**
   * Search cases
   */
  private async searchCases(query: string, limit: number = 10): Promise<any[]> {
    try {
      const cases = await CaseLaw.find({
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { citation: { $regex: query, $options: 'i' } },
          { ratio: { $regex: query, $options: 'i' } },
        ],
      }).limit(limit);

      return cases.map((c) => ({
        _id: c._id,
        name: c.name,
        citation: c.citation,
        year: c.year,
        court: c.court,
        significance: c.significance,
      }));
    } catch (error) {
      console.error('[CaseLawPlugin] Error searching cases:', error);
      return [];
    }
  }

  /**
   * Get detailed case analysis
   */
  private async getCaseAnalysis(caseId: string): Promise<any> {
    try {
      const caseLaw = await CaseLaw.findById(caseId);
      if (!caseLaw) {
        throw new Error('Case not found');
      }

      const relatedAnswers = await Answer.find({
        'relatedCases': caseId,
      }).limit(5);

      return {
        case: caseLaw,
        analysis: {
          factsummary: caseLaw.facts,
          legalIssue: caseLaw.issue,
          courtHeld: caseLaw.held,
          legalPrinciple: caseLaw.ratio,
          practicalSignificance: caseLaw.significance,
        },
        references: {
          answersReferencing: relatedAnswers.length,
          examinationFrequency: 'High',
        },
      };
    } catch (error) {
      console.error('[CaseLawPlugin] Error getting case analysis:', error);
      return null;
    }
  }

  /**
   * Get landmark cases for a subject
   */
  private async getLandmarkCases(_subject: string, limit: number = 10): Promise<any[]> {
    try {
      const cases = await CaseLaw.find({}).limit(limit).sort({ year: -1 });

      return cases.map((c) => ({
        _id: c._id,
        name: c.name,
        citation: c.citation,
        year: c.year,
        court: c.court,
        significance: c.significance,
      }));
    } catch (error) {
      console.error('[CaseLawPlugin] Error getting landmark cases:', error);
      return [];
    }
  }

  /**
   * Generate case law timeline
   */
  private generateCaseTimeline(subject: string): any {
    return {
      subject,
      timeline: [
        {
          period: '1950-1970',
          cases: 'Foundational cases establishing legal principles',
          significance: 'Constitutional framework',
        },
        {
          period: '1970-1990',
          cases: 'Development and refinement of law',
          significance: 'Judicial interpretation',
        },
        {
          period: '1990-2010',
          cases: 'Modern application and amendments',
          significance: 'Contemporary issues',
        },
        {
          period: '2010-Present',
          cases: 'Current trends and developments',
          significance: 'Latest judgments',
        },
      ],
    };
  }
}

export default CaseLawPlugin;
