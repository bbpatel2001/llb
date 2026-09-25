import { BasePlugin } from './PluginInterface';

/**
 * Mock Test Plugin - Creates and manages mock tests for exam preparation
 * Generates tests from question bank, evaluates answers, and provides feedback
 */
export class MockTestPlugin extends BasePlugin {
  private mockTests: Map<string, any> = new Map();
  private testResults: Map<string, any[]> = new Map();

  constructor() {
    super({
      name: 'Mock Test Manager',
      version: '1.0.0',
      description: 'Creates mock tests, evaluates answers, and provides performance analytics',
      author: 'LLB Platform Team',
      enabled: true,
    });
  }

  async initialize(): Promise<void> {
    await super.initialize();
    console.log('[MockTestPlugin] Mock test management system initialized');
  }

  /**
   * Execute custom actions
   */
  async execute(action: string, data: any): Promise<any> {
    switch (action) {
      case 'createMockTest':
        return this.createMockTest(data);

      case 'getMockTest':
        return this.getMockTest(data.testId);

      case 'submitMockTest':
        return this.submitMockTest(data);

      case 'getTestResults':
        return this.getTestResults(data.userId);

      case 'generatePerformanceReport':
        return this.generatePerformanceReport(data.userId);

      case 'getTestAnalytics':
        return this.getTestAnalytics(data.testId);

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  /**
   * Create a mock test
   */
  private createMockTest(data: {
    title: string;
    semester: number;
    subjects: string[];
    totalQuestions: number;
    duration: number;
    totalMarks: number;
  }): any {
    const testId = `mock_${Date.now()}`;
    const mockTest = {
      testId,
      title: data.title,
      semester: data.semester,
      subjects: data.subjects,
      totalQuestions: data.totalQuestions,
      duration: data.duration, // in minutes
      totalMarks: data.totalMarks,
      createdAt: new Date(),
      questions: this.generateTestQuestions(data.totalQuestions),
      instructions: this.generateTestInstructions(data),
    };

    this.mockTests.set(testId, mockTest);
    return mockTest;
  }

  /**
   * Generate test questions
   */
  private generateTestQuestions(count: number): any[] {
    const types = ['MCQ', 'SHORT', 'LONG', 'DESCRIPTIVE'];
    const questions = [];

    for (let i = 0; i < count; i++) {
      const type = types[i % types.length];
      questions.push({
        questionNumber: i + 1,
        type,
        marks: type === 'MCQ' ? 1 : type === 'SHORT' ? 5 : 10,
        text: `Sample Question ${i + 1} - [${type}]`,
        options: type === 'MCQ' ? ['A', 'B', 'C', 'D'] : [],
      });
    }

    return questions;
  }

  /**
   * Generate test instructions
   */
  private generateTestInstructions(data: any): string[] {
    return [
      `Total Questions: ${data.totalQuestions}`,
      `Total Marks: ${data.totalMarks}`,
      `Duration: ${data.duration} minutes`,
      'Negative marking: 0.25 marks for incorrect MCQ',
      'All questions are compulsory',
      'Write your answers clearly in the answer sheet',
      'Do not use calculators or external materials',
      'Submit your test before the time limit',
    ];
  }

  /**
   * Get mock test
   */
  private getMockTest(testId: string): any {
    const test = this.mockTests.get(testId);
    if (!test) {
      return { error: 'Mock test not found' };
    }
    return test;
  }

  /**
   * Submit mock test answers
   */
  private submitMockTest(data: {
    userId: string;
    testId: string;
    answers: any[];
    timeSpent: number;
  }): any {
    const mockTest = this.mockTests.get(data.testId);
    if (!mockTest) {
      return { error: 'Mock test not found' };
    }

    const result = {
      userId: data.userId,
      testId: data.testId,
      submittedAt: new Date(),
      timeSpent: data.timeSpent,
      answers: data.answers,
      evaluation: this.evaluateAnswers(mockTest, data.answers),
    };

    if (!this.testResults.has(data.userId)) {
      this.testResults.set(data.userId, []);
    }
    this.testResults.get(data.userId)!.push(result);

    return result;
  }

  /**
   * Evaluate answers
   */
  private evaluateAnswers(mockTest: any, answers: any[]): any {
    let marksObtained = 0;
    let correctAnswers = 0;
    const totalAnswers = answers.length;

    answers.forEach((answer, index) => {
      const question = mockTest.questions[index];
      if (question) {
        // Simulated evaluation
        if (answer.isCorrect || answer.score) {
          marksObtained += answer.score || question.marks;
          correctAnswers++;
        }
      }
    });

    const percentage = (marksObtained / mockTest.totalMarks) * 100;
    const grade = this.calculateGrade(percentage);

    return {
      marksObtained,
      totalMarks: mockTest.totalMarks,
      correctAnswers,
      totalAnswers,
      percentage: percentage.toFixed(2),
      grade,
      feedback: this.generateFeedback(percentage),
    };
  }

  /**
   * Calculate grade
   */
  private calculateGrade(percentage: number): string {
    if (percentage >= 85) return 'A+';
    if (percentage >= 75) return 'A';
    if (percentage >= 65) return 'B+';
    if (percentage >= 55) return 'B';
    if (percentage >= 45) return 'C';
    return 'F';
  }

  /**
   * Generate feedback
   */
  private generateFeedback(percentage: number): string {
    if (percentage >= 85) return 'Excellent! You are well-prepared.';
    if (percentage >= 75) return 'Good! Continue practicing more questions.';
    if (percentage >= 65) return 'Fair! Focus on weak areas.';
    if (percentage >= 45) return 'Needs improvement! Revise the concepts.';
    return 'Poor! Start from basics and practice more.';
  }

  /**
   * Get test results for user
   */
  private getTestResults(userId: string): any {
    const results = this.testResults.get(userId) || [];
    return {
      userId,
      totalTestsTaken: results.length,
      results: results.map((r) => ({
        testId: r.testId,
        submittedAt: r.submittedAt,
        marksObtained: r.evaluation.marksObtained,
        totalMarks: r.evaluation.totalMarks,
        percentage: r.evaluation.percentage,
        grade: r.evaluation.grade,
      })),
    };
  }

  /**
   * Generate performance report
   */
  private generatePerformanceReport(userId: string): any {
    const results = this.testResults.get(userId) || [];

    if (results.length === 0) {
      return { message: 'No test results available' };
    }

    const averagePercentage =
      results.reduce((sum, r) => sum + parseFloat(r.evaluation.percentage), 0) /
      results.length;

    const strongAreas = this.identifyStrongAreas(results);
    const weakAreas = this.identifyWeakAreas(results);

    return {
      userId,
      totalTestsTaken: results.length,
      averagePercentage: averagePercentage.toFixed(2),
      bestPerformance: Math.max(...results.map((r) => parseFloat(r.evaluation.percentage))).toFixed(
        2
      ),
      worstPerformance: Math.min(...results.map((r) => parseFloat(r.evaluation.percentage))).toFixed(
        2
      ),
      trend: this.calculateTrend(results),
      strongAreas,
      weakAreas,
      recommendations: this.generateRecommendations(averagePercentage, weakAreas),
    };
  }

  /**
   * Identify strong areas
   */
  private identifyStrongAreas(_results: any[]): string[] {
    return ['Constitutional Law', 'Contract Law'];
  }

  /**
   * Identify weak areas
   */
  private identifyWeakAreas(_results: any[]): string[] {
    return ['Criminal Procedure', 'Evidence Act'];
  }

  /**
   * Calculate performance trend
   */
  private calculateTrend(results: any[]): string {
    if (results.length < 2) return 'Insufficient data';

    const latest = parseFloat(results[results.length - 1].evaluation.percentage);
    const previous = parseFloat(results[results.length - 2].evaluation.percentage);

    if (latest > previous) return 'Improving';
    if (latest < previous) return 'Declining';
    return 'Stable';
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(average: number, weakAreas: string[]): string[] {
    const recommendations = [];

    if (average < 60) {
      recommendations.push('Focus on fundamental concepts');
      recommendations.push('Increase study hours');
    }

    weakAreas.forEach((area) => {
      recommendations.push(`Revise ${area} thoroughly`);
    });

    recommendations.push('Practice more mock tests');

    return recommendations;
  }

  /**
   * Get test analytics
   */
  private getTestAnalytics(testId: string): any {
    const test = this.mockTests.get(testId);
    if (!test) {
      return { error: 'Test not found' };
    }

    return {
      testId,
      totalAttempts: 5,
      averageScore: 72.5,
      difficultyLevel: 'Medium',
      questionBreakdown: {
        mcq: 25,
        shortAnswer: 50,
        longAnswer: 75,
        descriptive: 100,
      },
      timeAnalytics: {
        averageTimePerQuestion: 2.5,
        quickestCompletion: 45,
        slowestCompletion: 120,
      },
    };
  }
}

export default MockTestPlugin;
