#!/usr/bin/env node
/**
 * Fix Question Marks
 * Extracts actual marks from question text instead of using default 5
 */

import 'dotenv/config';
import { Question, IQuestion } from '../models/Question';
import mongoose from 'mongoose';

async function extractMarksFromText(text: string): Promise<number> {
  if (!text) return 5;

  // Pattern 1: Number at the very end (e.g., "...question 20" or "...1942. 20")
  const endMatch = text.match(/\s+(\d{1,3})\s*$|\.?\s*(\d{1,3})\s*marks?\s*$/i);
  if (endMatch) {
    const marks = parseInt(endMatch[1] || endMatch[2]);
    if (marks >= 1 && marks <= 100) return marks;
  }

  // Pattern 2: (marks) or (20 marks) format
  const parenMatch = text.match(/\((\d{1,3})\s*(?:marks?|m)?\)/i);
  if (parenMatch) {
    const marks = parseInt(parenMatch[1]);
    if (marks >= 1 && marks <= 100) return marks;
  }

  // Pattern 3: [20 marks] or [20]
  const bracketMatch = text.match(/\[(\d{1,3})\s*(?:marks?)?\]/i);
  if (bracketMatch) {
    const marks = parseInt(bracketMatch[1]);
    if (marks >= 1 && marks <= 100) return marks;
  }

  // Pattern 4: MCQ with 1 mark each
  if (text.match(/\(A\)|\(B\)|\(C\)|\(D\)/i) && !text.match(/\d{2,}/)) {
    return 1;
  }

  // Pattern 5: SHORT answer typically 5-10 marks
  if (text.length < 100) return 5;

  // Pattern 6: LONG/DESCRIPTIVE typically 20-25 marks
  if (text.length > 200) return 25;

  // Default
  return 5;
}

async function determineType(
  text: string,
  currentType: IQuestion['type'],
  marks: number
): Promise<'SHORT' | 'LONG' | 'MCQ' | 'CASE_STUDY' | 'DESCRIPTIVE'> {
  // MCQ detection
  if (text.includes('(A)') || text.includes('(a)')) {
    return 'MCQ';
  }

  // Based on marks
  if (marks === 1) return 'MCQ';
  if (marks <= 5) return 'SHORT';
  if (marks >= 20) return 'LONG';

  // Based on text length
  if (text.length < 80) return 'SHORT';
  if (text.length > 300) return 'DESCRIPTIVE';

  return currentType || 'LONG';
}

function determineDifficulty(marks: number): 'EASY' | 'MEDIUM' | 'HARD' {
  if (marks <= 2) return 'EASY';
  if (marks <= 10) return 'MEDIUM';
  return 'HARD';
}

async function main() {
  try {
    console.log('\n🔧 Fixing Question Marks\n');

    const dbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/llb';
    console.log('Connecting to database...');
    await mongoose.connect(dbUri);

    // Get all questions
    const questions = await Question.find().lean();
    console.log(`\nFound ${questions.length} questions\n`);

    const shouldApply = process.argv.includes('--apply');
    let updated = 0;
    const changes = [];

    for (const q of questions) {
      const extractedMarks = await extractMarksFromText(q.questionText);
      const newType = await determineType(q.questionText, q.type, extractedMarks);
      const newDifficulty = determineDifficulty(extractedMarks);

      // Check if changes needed
      if (
        extractedMarks !== q.marks ||
        newType !== q.type ||
        newDifficulty !== q.difficulty
      ) {
        changes.push({
          id: q._id,
          oldMarks: q.marks,
          newMarks: extractedMarks,
          oldType: q.type,
          newType: newType,
          oldDifficulty: q.difficulty,
          newDifficulty: newDifficulty,
          questionText: q.questionText.substring(0, 60) + '...',
        });

        if (shouldApply) {
          await Question.updateOne(
            { _id: q._id },
            {
              marks: extractedMarks,
              type: newType,
              difficulty: newDifficulty,
            }
          );
          updated++;
        }
      }
    }

    console.log(`\n📋 Changes Found: ${changes.length}\n`);

    // Show first 10 changes
    for (let i = 0; i < Math.min(10, changes.length); i++) {
      const c = changes[i];
      console.log(`  ${i + 1}. ${c.questionText}`);
      console.log(
        `     Marks: ${c.oldMarks} → ${c.newMarks} | Type: ${c.oldType} → ${c.newType} | Difficulty: ${c.oldDifficulty} → ${c.newDifficulty}`
      );
    }

    if (changes.length > 10) {
      console.log(`  ... and ${changes.length - 10} more changes`);
    }

    console.log(`\n${'═'.repeat(60)}`);
    console.log('SUMMARY');
    console.log('═'.repeat(60));
    console.log(`Total questions scanned: ${questions.length}`);
    console.log(`Changes needed:          ${changes.length}`);

    if (shouldApply) {
      console.log(`Updated:                 ${updated}`);
      console.log('\n✅ All questions fixed!\n');
    } else {
      console.log('\n⚠️  Preview mode - no changes applied');
      console.log('\nTo apply these changes, run:');
      console.log('  npm run fix:marks -- --apply\n');
    }

    // Statistics
    if (changes.length > 0) {
      const marksChanges = changes.filter(c => c.oldMarks !== c.newMarks);
      const typeChanges = changes.filter(c => c.oldType !== c.newType);
      const difficultyChanges = changes.filter(
        c => c.oldDifficulty !== c.newDifficulty
      );

      console.log('Changes by category:');
      console.log(`  Marks changed:       ${marksChanges.length}`);
      console.log(`  Type changed:        ${typeChanges.length}`);
      console.log(`  Difficulty changed:  ${difficultyChanges.length}`);

      // Marks distribution
      const marksBefore = new Map<number, number>();
      const marksAfter = new Map<number, number>();

      for (const q of questions) {
        marksBefore.set(q.marks, (marksBefore.get(q.marks) || 0) + 1);
      }

      for (const c of changes) {
        marksAfter.set(c.newMarks, (marksAfter.get(c.newMarks) || 0) + 1);
      }

      console.log('\nMarks distribution (before):');
      Array.from(marksBefore.entries())
        .sort((a, b) => a[0] - b[0])
        .slice(0, 5)
        .forEach(([marks, count]) => {
          console.log(`  ${marks} marks: ${count} questions`);
        });

      console.log('\nMarks distribution (after proposed):');
      Array.from(marksAfter.entries())
        .sort((a, b) => a[0] - b[0])
        .slice(0, 5)
        .forEach(([marks, count]) => {
          console.log(`  ${marks} marks: ${count} questions`);
        });
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

main();
