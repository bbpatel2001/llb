import { BasePlugin } from './PluginInterface';

interface AnalyticsEvent {
  event: string;
  timestamp: Date;
  userId?: string;
  data: any;
}

/**
 * Analytics Plugin - Tracks user interactions and platform metrics
 */
export class AnalyticsPlugin extends BasePlugin {
  private events: AnalyticsEvent[] = [];
  private eventMetrics: Map<string, number> = new Map();

  constructor() {
    super({
      name: 'Analytics Plugin',
      version: '1.0.0',
      description: 'Tracks user interactions and generates analytics reports',
      author: 'LLB Platform Team',
      enabled: true,
    });

    this.hooks = {
      onAfterAnswerGenerate: this.trackAnswerGeneration.bind(this),
      onBeforeFlashcardCreate: this.trackFlashcardCreation.bind(this),
      onBeforeTimelineGenerate: this.trackTimelineGeneration.bind(this),
    };
  }

  async initialize(): Promise<void> {
    await super.initialize();
    console.log('[AnalyticsPlugin] Initialized analytics tracking system');
  }

  /**
   * Track answer generation
   */
  private async trackAnswerGeneration(answer: any): Promise<any> {
    this.trackEvent('answer_generated', { type: answer.type, questionId: answer.questionId });
    return answer;
  }

  /**
   * Track flashcard creation
   */
  private async trackFlashcardCreation(flashcard: any): Promise<any> {
    this.trackEvent('flashcard_created', { deckId: flashcard.deckId });
    return flashcard;
  }

  /**
   * Track timeline generation
   */
  private async trackTimelineGeneration(timeline: any): Promise<any> {
    this.trackEvent('timeline_generated', { subject: timeline.subject, topic: timeline.topic });
    return timeline;
  }

  /**
   * Track an event
   */
  private trackEvent(event: string, data: any, userId?: string): void {
    const analyticsEvent: AnalyticsEvent = {
      event,
      timestamp: new Date(),
      userId,
      data,
    };

    this.events.push(analyticsEvent);

    // Update metrics
    const count = this.eventMetrics.get(event) || 0;
    this.eventMetrics.set(event, count + 1);

    console.log(`[AnalyticsPlugin] Event tracked: ${event}`);
  }

  /**
   * Execute custom actions
   */
  async execute(action: string, data: any): Promise<any> {
    switch (action) {
      case 'trackCustomEvent':
        this.trackEvent(data.event, data.data, data.userId);
        return { success: true };

      case 'getMetrics':
        return this.getMetrics();

      case 'getEventsByType':
        return this.getEventsByType(data.event);

      case 'generateReport':
        return this.generateReport();

      case 'getTopContent':
        return this.getTopContent();

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  /**
   * Get all metrics
   */
  private getMetrics(): any {
    return {
      totalEvents: this.events.length,
      metrics: Object.fromEntries(this.eventMetrics),
      trackingPeriod: {
        start: this.events.length > 0 ? this.events[0].timestamp : null,
        end: this.events.length > 0 ? this.events[this.events.length - 1].timestamp : null,
      },
    };
  }

  /**
   * Get events by type
   */
  private getEventsByType(eventType: string): AnalyticsEvent[] {
    return this.events.filter((e) => e.event === eventType);
  }

  /**
   * Generate analytics report
   */
  private generateReport(): any {
    const metrics = this.getMetrics();
    const uniqueUsers = new Set(this.events.map((e) => e.userId).filter(Boolean)).size;

    return {
      summary: {
        totalEvents: metrics.totalEvents,
        uniqueUsers,
        trackingPeriod: metrics.trackingPeriod,
      },
      eventBreakdown: metrics.metrics,
      topActivities: this.getTopActivities(5),
      recommendations: this.generateRecommendations(),
    };
  }

  /**
   * Get top activities
   */
  private getTopActivities(limit: number): Array<{ activity: string; count: number }> {
    return Array.from(this.eventMetrics.entries())
      .map(([activity, count]) => ({ activity, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  /**
   * Generate recommendations based on analytics
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    const metrics = this.eventMetrics;

    if (!metrics.has('answer_generated') || metrics.get('answer_generated')! < 10) {
      recommendations.push('Increase answer generation feature promotion');
    }

    if (!metrics.has('flashcard_created') || metrics.get('flashcard_created')! < 5) {
      recommendations.push('Improve flashcard creation UI/UX');
    }

    if (metrics.get('answer_generated')! > 100) {
      recommendations.push('Consider implementing answer caching for performance');
    }

    return recommendations;
  }

  /**
   * Get top content
   */
  private getTopContent(): any {
    const answerGenerations = this.getEventsByType('answer_generated');

    const contentStats: Map<string, number> = new Map();
    answerGenerations.forEach((e) => {
      const type = e.data.type;
      contentStats.set(type, (contentStats.get(type) || 0) + 1);
    });

    return {
      answerTypes: Object.fromEntries(contentStats),
      totalAnswersGenerated: answerGenerations.length,
    };
  }
}

export default AnalyticsPlugin;
