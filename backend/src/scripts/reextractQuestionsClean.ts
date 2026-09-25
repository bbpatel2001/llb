import mongoose from 'mongoose';
import { Question } from '../models/Question';
import { Paper } from '../models/Paper';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Re-extract questions from JSON files with proper cleaning and deduplication
 * This script:
 * 1. Clears existing questions (optional)
 * 2. Loads all questions from extracted_questions/*.json
 * 3. Cleans question text (removes marks, OR sections, etc.)
 * 4. Deduplicates intelligently
 * 5. Validates data quality
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

// ExtractionStats interface removed - not used in this script

/**
 * Aggressively clean question text
 */
function cleanQuestionText(text: string): string {
  if (!text) return '';

  // Step 1: Remove leading question numbers
  let cleaned = text.replace(/^\d+\.\s*/, '');

  // Step 2: Remove common suffix patterns
  // Marks: "20", "25", "100", etc. at the end
  cleaned = cleaned.replace(/\s+\d+\s*$/, '');

  // Step 3: Remove " OR" and everything after it (alternative questions)
  cleaned = cleaned.replace(/\s+OR\s+[^]*$/i, '');

  // Step 4: Remove trailing extraction artifacts
  // Single letters, extra periods, etc.
  cleaned = cleaned.replace(/\s+[a-zA-Z]\s*$/, '');

  // Step 5: Handle the pattern "2. text 20 b" -> "2. text"
  // Where there's punctuation, then marks, then letters
  cleaned = cleaned.replace(/\.\s+\d+\s+[a-z]+\s*$/i, '.');

  // Step 6: Normalize whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  // Step 7: Remove extra periods
  cleaned = cleaned.replace(/\.+/, '.');

  return cleaned;
}

/**
 * Normalize question text for deduplication
 */
function normalizeForDedup(text: string): string {
  return cleanQuestionText(text).toLowerCase();
}

/**
 * Load all questions from JSON files
 */
async function loadQuestionsFromJSON(): Promise<{
  questions: CleanedQuestion[];
  stats: { filesProcessed: number; questionsLoaded: number; errors: string[] };
}> {
  const questionDir = path.join(__dirname, '../../..', 'extracted_questions');
  const files = fs
    .readdirSync(questionDir)
    .filter(f => f.endsWith('.json') && !f.includes('backup') && !f.includes('bak'));

  const allQuestions: CleanedQuestion[] = [];
  const errors: string[] = [];
  let totalLoaded = 0;

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
          totalLoaded++;
        }
      }

      console.log(`✓ Loaded ${questions.length} questions from ${file}`);
    } catch (error) {
      const errorMsg = `Error loading ${file}: ${(error as Error).message}`;
      errors.push(errorMsg);
      console.error(`✗ ${errorMsg}`);
    }
  }

  return {
    questions: allQuestions,
    stats: {
      filesProcessed: files.length,
      questionsLoaded: totalLoaded,
      errors,
    },
  };
}

/**
 * Deduplicate questions based on normalized text
 */
function deduplicateQuestions(questions: CleanedQuestion[]): {
  unique: CleanedQuestion[];
  duplicates: number;
  samples: string[];
}[] {
  const seen = new Map<string, CleanedQuestion>();
  const duplicates: string[] = [];
  let duplicateCount = 0;

  for (const question of questions) {
    const normalized = normalizeForDedup(question.questionText);

    if (seen.has(normalized)) {
      duplicateCount++;
      duplicates.push(
        `"${question.questionText}" -> "${seen.get(normalized)!.questionText}"`
      );
    } else {
      seen.set(normalized, question);
    }
  }

  return [
    {
      unique: Array.from(seen.values()),
      duplicates: duplicateCount,
      samples: duplicates.slice(0, 5),
    },
  ];
}

/**
 * Clean and prepare questions for insertion
 */
function prepareQuestionsForInsertion(
  questions: CleanedQuestion[],
  paperId: string,
  semester: number,
  subject: string
): Array<any> {
  return questions.map(q => ({
    paperId,
    semester,
    subject,
    questionNumber: q.questionNumber,
    questionText: cleanQuestionText(q.questionText),
    marks: Math.min(q.marks, 50), // Cap at 50 marks
    type: q.type,
    difficulty: q.difficulty,
    tags: q.tags,
    options: q.options,
    correctAnswer: q.correctAnswer,
    source: {
      fileName: 'extraction',
      year: 2024,
      university: 'LLB',
    },
    extractionQuality: 100,
  }));
}

/**
 * Main execution
 */
async function main() {
  try {
    const dbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/llb-platform';

    console.log('\n📚 Starting Question Re-Extraction Pipeline\n');
    console.log('Connecting to database...');
    await mongoose.connect(dbUri);

    // Step 1: Load questions from JSON files
    console.log('\n1️⃣  Loading questions from JSON files...');
    const { questions: rawQuestions } = await loadQuestionsFromJSON();
    console.log(`Total questions loaded: ${rawQuestions.length}\n`);

    // Step 2: Clean questions
    console.log('2️⃣  Cleaning question text...');
    const cleanedQuestions = rawQuestions.map(q => ({
      ...q,
      questionText: cleanQuestionText(q.questionText),
    }));

    // Show some examples
    console.log('\nExample cleanings:');
    for (let i = 0; i < Math.min(3, rawQuestions.length); i++) {
      const original = rawQuestions[i].questionText;
      const cleaned = cleanedQuestions[i].questionText;
      if (original !== cleaned) {
        console.log(`  Before: "${original}"`);
        console.log(`  After:  "${cleaned}"\n`);
      }
    }

    // Step 3: Deduplicate
    console.log('3️⃣  Deduplicating questions...');
    const [dedup] = deduplicateQuestions(cleanedQuestions);
    console.log(`Unique questions: ${dedup.unique.length}`);
    console.log(`Duplicates removed: ${dedup.duplicates}`);

    if (dedup.samples.length > 0) {
      console.log('\nDuplicate examples:');
      for (const sample of dedup.samples) {
        console.log(`  ${sample}`);
      }
    }

    // Step 4: Ask for confirmation before clearing and reinserting
    console.log('\n4️⃣  Preparing for database update...');
    console.log(`\n⚠️  This will:`);
    console.log(`  1. Delete all existing questions (${(await Question.countDocuments())} total)`);
    console.log(`  2. Insert ${dedup.unique.length} cleaned & deduplicated questions\n`);

    const args = process.argv.slice(2);
    const shouldProceed = args.includes('--confirm');

    if (!shouldProceed) {
      console.log('To proceed, run with: --confirm flag\n');
      console.log('Example: npm run script -- reextractQuestionsClean.ts --confirm\n');
      process.exit(0);
    }

    console.log('Proceeding with database update...\n');

    // Step 5: Clear existing questions
    console.log('5️⃣  Clearing existing questions...');
    const deleteResult = await Question.deleteMany({});
    console.log(`Deleted ${deleteResult.deletedCount} questions`);

    // Step 6: Insert cleaned questions
    console.log('\n6️⃣  Inserting cleaned questions...');

    // Get or create a default paper
    let paper = await Paper.findOne();
    if (!paper) {
      paper = await Paper.create({
        year: 2024,
        semester: 1,
        subject: 'CONSTITUTIONAL',
        university: 'LLB',
        fileName: 'cleaned-extraction',
      });
      console.log(`Created default paper: ${paper._id}`);
    }

    // Prepare questions with paper reference
    const questionsToInsert = prepareQuestionsForInsertion(
      dedup.unique,
      paper._id.toString(),
      1,
      'CONSTITUTIONAL'
    );

    const insertResult = await Question.insertMany(questionsToInsert);
    console.log(`✓ Inserted ${insertResult.length} questions\n`);

    // Step 7: Verification
    console.log('7️⃣  Verification:');
    const finalCount = await Question.countDocuments();
    console.log(`Total questions in database: ${finalCount}`);

    // Check for remaining duplicates
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
      console.log('✓ No duplicates remaining!\n');
    } else {
      console.log(`⚠️  Found ${dupCheck.length} duplicate question texts\n`);
    }

    console.log('✅ Re-extraction complete!\n');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

main();
