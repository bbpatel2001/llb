import mongoose from 'mongoose';
import { Question } from '../models/Question';
import * as path from 'path';
import * as fs from 'fs';

interface DuplicateGroup {
  normalizedText: string;
  questions: any[];
}

/**
 * Normalize question text to identify duplicates
 * Remove trailing marks, "OR", and extra text that shouldn't be part of the core question
 */
function normalizeQuestionText(text: string): string {
  if (!text) return '';

  // Remove trailing patterns like "20", "25", "OR", "a", "b", "s", etc.
  // These are often extraction artifacts
  const normalized = text
    // Remove leading question numbers (1., 2., etc.)
    .replace(/^\d+\.\s*/, '')
    // Remove trailing marks (e.g., " 20", " 25")
    .replace(/\s+\d+\s*$/, '')
    // Remove " OR" and everything after it
    .replace(/\s+OR\s+.*$/i, '')
    // Remove trailing single characters followed by spaces (extraction artifacts)
    .replace(/\s+[a-z]\s*$/, '')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim();

  return normalized.toLowerCase();
}

/**
 * Find duplicate questions in the database
 */
async function findDuplicatesInDB(): Promise<DuplicateGroup[]> {
  const allQuestions = await Question.find({});

  const groups: Map<string, DuplicateGroup> = new Map();

  for (const question of allQuestions) {
    const normalized = normalizeQuestionText(question.questionText);

    if (!groups.has(normalized)) {
      groups.set(normalized, {
        normalizedText: normalized,
        questions: [],
      });
    }

    groups.get(normalized)!.questions.push({
      _id: question._id,
      originalText: question.questionText,
      subject: question.subject,
      semester: question.semester,
      marks: question.marks,
      paperId: question.paperId,
    });
  }

  // Filter to only groups with duplicates
  return Array.from(groups.values()).filter(group => group.questions.length > 1);
}

/**
 * Find duplicate questions in JSON files
 */
async function findDuplicatesInJSON(): Promise<Map<string, any[]>> {
  const questionDir = path.join(__dirname, '../../..', 'extracted_questions');
  const files = fs.readdirSync(questionDir).filter(f => f.endsWith('.json') && !f.includes('backup') && !f.includes('bak'));

  const duplicates: Map<string, any[]> = new Map();

  for (const file of files) {
    const filePath = path.join(questionDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const questions = JSON.parse(content);

    for (const question of questions) {
      const normalized = normalizeQuestionText(question.questionText);

      if (!duplicates.has(normalized)) {
        duplicates.set(normalized, []);
      }

      duplicates.get(normalized)!.push({
        file,
        questionNumber: question.questionNumber,
        originalText: question.questionText,
        marks: question.marks,
      });
    }
  }

  // Filter to only entries with duplicates
  const result: Map<string, any[]> = new Map();
  for (const [normalized, items] of duplicates.entries()) {
    if (items.length > 1) {
      result.set(normalized, items);
    }
  }

  return result;
}

/**
 * Clean database by removing duplicates (keeping the first occurrence)
 */
async function cleanDatabase(): Promise<{
  duplicateGroupsFound: number;
  totalDuplicatesRemoved: number;
}> {
  const duplicates = await findDuplicatesInDB();
  let totalRemoved = 0;

  for (const group of duplicates) {
    // Keep the first one, remove the rest
    const toRemove = group.questions.slice(1);

    for (const question of toRemove) {
      await Question.findByIdAndDelete(question._id);
      totalRemoved++;
    }
  }

  return {
    duplicateGroupsFound: duplicates.length,
    totalDuplicatesRemoved: totalRemoved,
  };
}

/**
 * Generate a report of duplicates found
 */
async function generateReport(): Promise<void> {
  console.log('\n=== DUPLICATE DETECTION REPORT ===\n');

  // Database duplicates
  console.log('DATABASE DUPLICATES:');
  const dbDuplicates = await findDuplicatesInDB();

  if (dbDuplicates.length === 0) {
    console.log('✓ No duplicates found in database\n');
  } else {
    console.log(`Found ${dbDuplicates.length} duplicate groups:\n`);

    for (const group of dbDuplicates.slice(0, 10)) {
      console.log(`Normalized: "${group.normalizedText}"`);
      for (const q of group.questions) {
        console.log(`  - "${q.originalText}"`);
        console.log(`    (${q.subject} - Sem ${q.semester} - ${q.marks} marks)\n`);
      }
    }

    if (dbDuplicates.length > 10) {
      console.log(`... and ${dbDuplicates.length - 10} more groups\n`);
    }
  }

  // JSON file duplicates
  console.log('JSON FILE DUPLICATES:');
  const jsonDuplicates = await findDuplicatesInJSON();

  if (jsonDuplicates.size === 0) {
    console.log('✓ No duplicates found in JSON files\n');
  } else {
    console.log(`Found ${jsonDuplicates.size} duplicate groups:\n`);

    let count = 0;
    for (const [normalized, items] of jsonDuplicates.entries()) {
      if (count >= 10) {
        console.log(`... and ${jsonDuplicates.size - 10} more groups\n`);
        break;
      }

      console.log(`Normalized: "${normalized}"`);
      for (const item of items) {
        console.log(`  - File: ${item.file}`);
        console.log(`    "${item.originalText}"\n`);
      }

      count++;
    }
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    const dbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/llb-platform';

    console.log('Connecting to database...');
    await mongoose.connect(dbUri);

    // Generate report
    await generateReport();

    // Ask for confirmation before cleaning
    console.log('\n=== CLEANUP OPTIONS ===');
    console.log('To clean duplicates from the database, run with: --clean-db');
    console.log('To remove duplicates from JSON files, run with: --clean-json');
    console.log('To do both, run with: --clean-all\n');

    const args = process.argv.slice(2);

    if (args.includes('--clean-all') || args.includes('--clean-db')) {
      console.log('Starting database cleanup...');
      const result = await cleanDatabase();
      console.log(`✓ Removed ${result.totalDuplicatesRemoved} duplicates from ${result.duplicateGroupsFound} groups\n`);
    }

    if (args.includes('--clean-all') || args.includes('--clean-json')) {
      console.log('JSON files require manual cleanup or a separate utility.');
      console.log('The JSON files would need to be reprocessed.\n');
    }

    console.log('Done!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

main();
