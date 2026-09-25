import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import answerGenerationAIService from '../services/answerGenerationAIService';
import { Answer } from '../models/Answer';
import { Question } from '../models/Question';

dotenv.config();

interface QuestionData {
  questionNumber: string;
  questionText: string;
  marks: number;
  type: string;
  difficulty: string;
  tags: string[];
  options?: any[];
  correctAnswer?: string;
}

interface ProcessingResult {
  file: string;
  totalQuestions: number;
  answersGenerated: number;
  errors: number;
  duration: number;
}

class AnswerGenerationBatch {
  private questionsDir = path.join(__dirname, '../../extracted_questions');
  private results: ProcessingResult[] = [];

  async run(): Promise<void> {
    console.log('='.repeat(80));
    console.log('LLB PLATFORM - BULK ANSWER GENERATION');
    console.log('='.repeat(80));
    console.log(`Start Time: ${new Date().toISOString()}\n`);

    try {
      // Connect to MongoDB
      await this.connectDatabase();

      // Get all question JSON files
      const questionFiles = this.getQuestionFiles();
      console.log(`Found ${questionFiles.length} question files to process\n`);

      // Process each file
      for (const file of questionFiles) {
        await this.processQuestionFile(file);
      }

      // Summary
      this.printSummary();
    } catch (error) {
      console.error('Critical error:', error);
      process.exit(1);
    } finally {
      await mongoose.disconnect();
      console.log(`\nEnd Time: ${new Date().toISOString()}`);
    }
  }

  private getQuestionFiles(): string[] {
    try {
      const files = fs.readdirSync(this.questionsDir);
      return files
        .filter(f => f.endsWith('.json') && !f.includes('backup') && !f.includes('bak') && !f.includes('manifest'))
        .map(f => path.join(this.questionsDir, f));
    } catch (error) {
      console.error('Error reading question files:', error);
      return [];
    }
  }

  private async processQuestionFile(filePath: string): Promise<void> {
    const startTime = Date.now();
    const fileName = path.basename(filePath);

    console.log(`\n${'-'.repeat(80)}`);
    console.log(`Processing: ${fileName}`);
    console.log(`${'-'.repeat(80)}`);

    try {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const questions: QuestionData[] = JSON.parse(fileContent);

      console.log(`Total Questions: ${questions.length}`);

      let answersGenerated = 0;
      let errors = 0;

      // Process questions in batches
      const batchSize = 5;
      for (let i = 0; i < questions.length; i += batchSize) {
        const batch = questions.slice(i, Math.min(i + batchSize, questions.length));
        const batchNumber = Math.floor(i / batchSize) + 1;
        const totalBatches = Math.ceil(questions.length / batchSize);

        console.log(`\n  Batch ${batchNumber}/${totalBatches}:`);

        for (const question of batch) {
          try {
            const answer = await answerGenerationAIService.generateAnswer(question);
            await this.saveAnswer(question, answer);
            answersGenerated++;
            process.stdout.write('.');
          } catch (error) {
            console.error(`\n    Error processing Q${question.questionNumber}:`, error);
            errors++;
            process.stdout.write('E');
          }
        }

        // Rate limiting between batches
        if (i + batchSize < questions.length) {
          await this.delay(2000);
        }
      }

      const duration = Date.now() - startTime;
      const result: ProcessingResult = {
        file: fileName,
        totalQuestions: questions.length,
        answersGenerated,
        errors,
        duration: Math.round(duration / 1000),
      };

      this.results.push(result);

      console.log(`\n  Result: ${answersGenerated}/${questions.length} answers generated (${errors} errors)`);
      console.log(`  Duration: ${result.duration}s`);
    } catch (error) {
      console.error(`Error processing file ${fileName}:`, error);
    }
  }

  private async saveAnswer(question: QuestionData, answer: any): Promise<void> {
    try {
      // Find the question in database
      const dbQuestion = await Question.findOne({
        questionNumber: question.questionNumber,
      });

      if (!dbQuestion) {
        console.warn(`Question ${question.questionNumber} not found in database`);
        return;
      }

      // Create answer
      const answerDoc = new Answer({
        questionId: dbQuestion._id,
        type: answer.type,
        text: answer.text,
        wordCount: answer.wordCount,
        keyPoints: answer.keyPoints,
        casesReferred: answer.casesReferred,
        actsReferred: answer.actsReferred,
        studyTips: answer.studyTips,
        difficulty: answer.difficulty,
        generatedBy: 'ai',
        qualityScore: answer.qualityScore,
        verified: false,
        mcqOptions: answer.mcqOptions,
        mcqExplanation: answer.mcqExplanation,
        sources: answer.sources,
      });

      await answerDoc.save();
    } catch (error) {
      console.error('Error saving answer:', error);
      throw error;
    }
  }

  private async connectDatabase(): Promise<void> {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/llb-platform';
    console.log(`Connecting to MongoDB: ${mongoUri.replace(/\/\/.*:.*@/, '//****:****@')}\n`);

    try {
      await mongoose.connect(mongoUri);
      console.log('✓ Database connected successfully\n');
    } catch (error) {
      console.error('✗ Failed to connect to database:', error);
      throw error;
    }
  }

  private printSummary(): void {
    console.log(`\n\n${'='.repeat(80)}`);
    console.log('PROCESSING SUMMARY');
    console.log(`${'='.repeat(80)}`);

    let totalQuestions = 0;
    let totalAnswers = 0;
    let totalErrors = 0;
    let totalDuration = 0;

    this.results.forEach(result => {
      console.log(`\n${result.file}:`);
      console.log(`  Questions: ${result.totalQuestions}`);
      console.log(`  Answers Generated: ${result.answersGenerated}`);
      console.log(`  Errors: ${result.errors}`);
      console.log(`  Duration: ${result.duration}s`);

      totalQuestions += result.totalQuestions;
      totalAnswers += result.answersGenerated;
      totalErrors += result.errors;
      totalDuration += result.duration;
    });

    console.log(`\n${'-'.repeat(80)}`);
    console.log(`TOTAL:`);
    console.log(`  Questions Processed: ${totalQuestions}`);
    console.log(`  Answers Generated: ${totalAnswers} (${((totalAnswers / totalQuestions) * 100).toFixed(2)}%)`);
    console.log(`  Errors: ${totalErrors}`);
    console.log(`  Total Duration: ${totalDuration}s (${(totalDuration / 60).toFixed(2)}m)`);
    console.log(`${'-'.repeat(80)}`);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run the batch processing
const batchProcessor = new AnswerGenerationBatch();
batchProcessor.run().catch(console.error);
