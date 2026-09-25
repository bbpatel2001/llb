import mongoose from 'mongoose';
import { Question } from '../models/Question';
import { Paper } from '../models/Paper';
import { QuestionValidationService } from '../services/questionValidationService';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Clean Garbage Questions Script
 * 
 * This script:
 * 1. Loads all extracted questions from JSON files
 * 2. Validates each question for quality and garbage content
 * 3. Removes duplicates and malformed questions
 * 4. Cleans question text aggressively
 * 5. Generates a comprehensive report
 * 6. Optionally updates the database
 */

interface CleanedQuestion {
  questionNumber: string;
  questionText: string;
  marks: number;
  type: 'SHORT' | 'LONG' | 'MCQ' | 'CASE_STUDY' | 'DESCRIPTIVE';
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  tags: string[];
  options?: Array<{ label: string; text: string }>;
  correctAnswer?: string;
}

/**
 * Aggressive cleaning of question text
 */
function aggressiveClean(text: string): string {
  if (!text) return '';

  let cleaned = text;

  // 1. Remove common website/social media references
  cleaned = cleaned.replace(/www\.\S+|instagram\.com\/\S+|@\w+|#\w+/gi, '');

  // 2. Remove exam metadata (codes, seat numbers, etc.)
  cleaned = cleaned.replace(
    /Seat\s+No\.\s*:|JV-\d+|NP-\d+|MF-\d+|NI\d+|-\d{3}\s*-?|Hours?\]?|\[Max\.\s+Marks[^\]]*\]?/gi,
    ''
  );

  // 3. Remove instruction footers and page markers
  cleaned = cleaned.replace(
    /\(?Instructions?[^.]*\)|Give.*answer|Write.*answer|Time\s*:\s*\d+|Max\.\s*Marks[^)]*\)?|page\s+\d+|www\.\w+|instagram[^)]*\)?/gi,
    ''
  );

  // 4. Remove leading question numbers (1., 2., etc.)
  cleaned = cleaned.replace(/^(\s*\d+\.\s*)*/, '');

  // 5. Remove trailing marks (20, 25, 100, etc.)
  cleaned = cleaned.replace(/\s+\d{1,3}\s*$/, '');

  // 6. Remove " OR section and everything after
  cleaned = cleaned.replace(/\s+OR\s+[^]*$/i, '');

  // 7. Remove trailing single letters or fragments
  cleaned = cleaned.replace(/\s+[a-z]\s*$|[\s,]*[a-z]\s*$/i, '');

  // 8. Handle the pattern "text 20 b" -> "text"
  cleaned = cleaned.replace(/(\w)\s+\d+\s+([a-z]+)\s*$/i, '$1');

  // 9. Remove broken lines and extra punctuation
  cleaned = cleaned.replace(/\.{2,}/g, '.'); // Multiple periods
  cleaned = cleaned.replace(/,{2,}/g, ','); // Multiple commas

  // 10. Normalize whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  // 11. Remove fragments with excessive special characters
  const lines = cleaned.split(/[.!?]/);
  const validLines = lines.filter(line => {
    const specialCharCount = (line.match(/[^a-zA-Z0-9\s]/g) || []).length;
    return specialCharCount / line.length < 0.3; // Less than 30% special chars
  });
  cleaned = validLines.join('. ').trim();

  // 12. Ensure ends with proper punctuation
  if (cleaned && !/[.!?]$/.test(cleaned)) {
    cleaned += '.';
  }

  return cleaned;
}

/**
 * Normalize for deduplication
 */
function normalizeForDedup(text: string): string {
  return aggressiveClean(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ''); // Remove all special chars for comparison
}

/**
 * Load all questions from JSON files
 */
async function loadQuestionsFromJSON(): Promise<CleanedQuestion[]> {
  const questionDir = path.join(__dirname, '../../..', 'extracted_questions');
  const files = fs
    .readdirSync(questionDir)
    .filter(f => f.endsWith('.json') && !f.includes('backup') && !f.includes('bak'));

  const allQuestions: CleanedQuestion[] = [];

  for (const file of files) {
    try {
      const filePath = path.join(questionDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const questions = JSON.parse(content);

      for (const q of questions) {
        if (q.questionText && q.marks && q.type) {
          allQuestions.push({
            questionNumber: q.questionNumber || '',
            questionText: q.questionText,
            marks: q.marks,
            type: q.type || 'DESCRIPTIVE',
            difficulty: q.difficulty || 'MEDIUM',
            tags: q.tags || [],
            options: q.options,
            correctAnswer: q.correctAnswer,
          });
        }
      }

      console.log(`✓ Loaded ${questions.length} from ${file}`);
    } catch (error) {
      console.error(`✗ Error loading ${file}:`, (error as Error).message);
    }
  }

  return allQuestions;
}

/**
 * Main cleaning pipeline
 */
async function main() {
  try {
    const dbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/llb-platform';
    const shouldConfirm = process.argv.includes('--confirm');
    const reportOnly = process.argv.includes('--report-only');

    console.log('\n🧹 Question Garbage Cleaning Pipeline\n');
    console.log('Step 1: Loading questions from JSON...');
    const rawQuestions = await loadQuestionsFromJSON();
    console.log(`Total questions loaded: ${rawQuestions.length}\n`);

    // Step 2: Validate and filter
    console.log('Step 2: Validating and filtering questions...');
    const { valid: validQuestions, invalid: invalidQuestions } =
      QuestionValidationService.filterGarbageQuestions(rawQuestions);

    console.log(`✓ Valid questions: ${validQuestions.length}`);
    console.log(`✗ Invalid/Garbage questions: ${invalidQuestions.length}`);
    console.log(`  Removal percentage: ${Math.round((invalidQuestions.length / rawQuestions.length) * 100)}%\n`);

    // Step 3: Clean valid questions
    console.log('Step 3: Cleaning valid question text...');
    const cleanedQuestions = validQuestions.map(q => ({
      ...q,
      questionText: aggressiveClean(q.questionText),
    }));

    // Show examples
    console.log('\nExample cleanings:');
    for (let i = 0; i < Math.min(3, validQuestions.length); i++) {
      const original = validQuestions[i].questionText;
      const cleaned = cleanedQuestions[i].questionText;
      if (original !== cleaned) {
        console.log(`  BEFORE: "${original.substring(0, 80)}..."`);
        console.log(`  AFTER:  "${cleaned.substring(0, 80)}..."\n`);
      }
    }

    // Step 4: Deduplicate
    console.log('Step 4: Deduplicating questions...');
    const seen = new Map<string, CleanedQuestion>();
    let duplicateCount = 0;
    const duplicateSamples: string[] = [];

    for (const question of cleanedQuestions) {
      const normalized = normalizeForDedup(question.questionText);

      if (seen.has(normalized)) {
        duplicateCount++;
        if (duplicateSamples.length < 5) {
          duplicateSamples.push(
            `"${question.questionText.substring(0, 50)}" -> "${seen.get(normalized)!.questionText.substring(0, 50)}"`
          );
        }
      } else {
        seen.set(normalized, question);
      }
    }

    const uniqueQuestions = Array.from(seen.values());
    console.log(`Unique questions after dedup: ${uniqueQuestions.length}`);
    console.log(`Duplicates removed: ${duplicateCount}\n`);

    if (duplicateSamples.length > 0) {
      console.log('Duplicate examples:');
      duplicateSamples.forEach(s => console.log(`  ${s}`));
      console.log();
    }

    // Step 5: Generate report on removed questions
    console.log('Step 5: Analyzing removed questions...\n');

    if (invalidQuestions.length > 0) {
      console.log('Removed question examples:');
      invalidQuestions.slice(0, 3).forEach((item: any, idx: number) => {
        console.log(`  ${idx + 1}. "${item.question.questionText.substring(0, 60)}"`);
        console.log(`     Issues: ${item.reason.issues.join(', ')}\n`);
      });
    }

    // Step 6: Summary
    console.log('\n📊 FINAL SUMMARY');
    console.log('═'.repeat(50));
    console.log(`Original questions:    ${rawQuestions.length}`);
    console.log(`After validation:      ${validQuestions.length}`);
    console.log(`After deduplication:   ${uniqueQuestions.length}`);
    console.log(`Total removed:         ${rawQuestions.length - uniqueQuestions.length}`);
    console.log(`Cleanup percentage:    ${Math.round(((rawQuestions.length - uniqueQuestions.length) / rawQuestions.length) * 100)}%`);
    console.log('═'.repeat(50));

    if (reportOnly) {
      console.log('\n✓ Report complete (--report-only mode)\n');
      process.exit(0);
    }

    if (!shouldConfirm) {
      console.log('\n⚠️  To apply changes to database, run with: --confirm flag\n');
      console.log('Example: npm run script -- cleanGarbageQuestions.ts --confirm\n');
      process.exit(0);
    }

    // Step 7: Database update
    console.log('\n7️⃣  Connecting to database...');
    await mongoose.connect(dbUri);

    console.log('Clearing existing questions...');
    const deleteResult = await Question.deleteMany({});
    console.log(`Deleted ${deleteResult.deletedCount} questions`);

    console.log('Inserting cleaned questions...');

    // Get or create default paper
    let paper = await Paper.findOne();
    if (!paper) {
      paper = await Paper.create({
        year: 2024,
        semester: 1,
        subject: 'CONSTITUTIONAL',
        university: 'LLB',
        fileName: 'cleaned-garbage-removed',
      });
    }

    const questionsToInsert = uniqueQuestions.map(q => ({
      paperId: paper!._id.toString(),
      semester: 1,
      subject: 'CONSTITUTIONAL',
      questionNumber: q.questionNumber,
      questionText: q.questionText,
      marks: Math.min(q.marks, 50),
      type: q.type,
      difficulty: q.difficulty,
      tags: q.tags,
      options: q.options,
      correctAnswer: q.correctAnswer,
      source: {
        fileName: 'cleaned-extraction',
        year: 2024,
        university: 'LLB',
      },
      extractionQuality: 100,
    }));

    const insertResult = await Question.insertMany(questionsToInsert);
    console.log(`✓ Inserted ${insertResult.length} cleaned questions\n`);

    // Verify no duplicates remain
    const dupCheck = await Question.aggregate([
      {
        $group: {
          _id: '$questionText',
          count: { $sum: 1 },
        },
      },
      {
        $match: {
          count: { $gt: 1 },
        },
      },
    ]);

    if (dupCheck.length === 0) {
      console.log('✓ No duplicates in database\n');
    } else {
      console.log(`⚠️  Found ${dupCheck.length} duplicate texts\n`);
    }

    console.log('✅ Garbage cleanup complete!\n');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

main();
