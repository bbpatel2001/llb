#!/usr/bin/env node
/**
 * Extract and consolidate questions from JSON files
 * Cleans garbage and loads into MongoDB
 */

import 'dotenv/config';
import { Question } from '../models/Question';
import { Paper } from '../models/Paper';
import mongoose from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function isGarbage(text: string): Promise<boolean> {
  if (!text || text.length < 30) return true;

  const nonAscii = (text.match(/[^\x00-\x7F]/g) || []).length;
  if (nonAscii > text.length * 0.4) return true; // 40% non-ASCII = garbage

  const specialChars = (text.match(/[^\w\s]/g) || []).length;
  if (specialChars / text.length > 0.3) return true; // 30% special chars = garbage

  return false;
}

async function main() {
  try {
    console.log('\n📚 Question Consolidation from JSON Files\n');

    const dbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/llb';
    console.log('Connecting to database...');
    await mongoose.connect(dbUri);

    // Check if --clean flag is set
    const shouldClean = process.argv.includes('--clean');
    
    if (shouldClean) {
      console.log('🧹 Clearing all existing questions...');
      const deleteResult = await Question.deleteMany({});
      console.log(`   Deleted: ${deleteResult.deletedCount} questions\n`);
    }

    const extractedQuestionsDir = path.join(__dirname, '../../..', 'extracted_questions');
    const jsonFiles = fs
      .readdirSync(extractedQuestionsDir)
      .filter(f => f.endsWith('.json') && !f.includes('backup') && !f.includes('bak'));

    console.log(`Found ${jsonFiles.length} JSON files\n`);

    let totalLoaded = 0;
    let totalValid = 0;
    let totalInserted = 0;
    let totalGarbage = 0;

    for (const jsonFile of jsonFiles) {
      try {
        const filePath = path.join(extractedQuestionsDir, jsonFile);
        const content = fs.readFileSync(filePath, 'utf-8');
        const questions = JSON.parse(content);

        totalLoaded += questions.length;

        // Extract metadata from filename
        const subjectMatch = jsonFile.match(/sem\d+_(\w+)/i);
        const subject = subjectMatch ? subjectMatch[1].toUpperCase() : 'GENERAL';

        const semesterMatch = jsonFile.match(/sem(\d+)/i);
        const semester = semesterMatch ? parseInt(semesterMatch[1]) : 1;

        console.log(`\n📄 ${jsonFile}`);
        console.log(`   Semester: ${semester}, Subject: ${subject}`);
        console.log(`   Total: ${questions.length}`);

        // Get or create paper
        let paper = await Paper.findOne({ fileName: jsonFile });
        if (!paper) {
          paper = await Paper.create({
            year: new Date().getFullYear(),
            semester: semester,
            subject: subject,
            university: 'OTHER',
            title: jsonFile.replace('.json', ''),
            fileName: jsonFile,
            status: 'COMPLETED',
          });
        }

        // Filter valid questions
        const validQuestions = [];
        for (const q of questions) {
          if (q.questionText && !(await isGarbage(q.questionText))) {
            validQuestions.push(q);
            totalValid++;
          } else {
            totalGarbage++;
          }
        }

        console.log(`   Valid: ${validQuestions.length}, Garbage: ${questions.length - validQuestions.length}`);

        if (validQuestions.length === 0) {
          console.log(`   ✓ Skipped (all garbage)`);
          continue;
        }

        // Insert into DB
        const questionsToInsert = validQuestions.map(q => ({
          paperId: paper._id.toString(),
          semester: semester,
          subject: subject,
          questionNumber: q.questionNumber || '',
          questionText: q.questionText,
          marks: Math.min(100, q.marks || 25),
          type: q.type || 'LONG',
          difficulty: q.difficulty || 'MEDIUM',
          options: q.options,
          correctAnswer: q.correctAnswer,
          source: {
            fileName: jsonFile,
            method: 'JSON-Consolidation',
          },
          extractionQuality: 100,
        }));

        const inserted = await Question.insertMany(questionsToInsert);
        totalInserted += inserted.length;
        console.log(`   ✓ Inserted: ${inserted.length} questions`);
      } catch (error) {
        console.error(`   ✗ Error: ${(error as Error).message}`);
      }
    }

    const finalCount = await Question.countDocuments();

    console.log(`\n${'═'.repeat(50)}`);
    console.log('📊 SUMMARY');
    console.log('═'.repeat(50));
    console.log(`Files processed:       ${jsonFiles.length}`);
    console.log(`Total questions loaded: ${totalLoaded}`);
    console.log(`Valid questions:        ${totalValid}`);
    console.log(`Garbage questions:      ${totalGarbage} (${Math.round((totalGarbage / totalLoaded) * 100)}%)`);
    console.log(`Questions inserted:     ${totalInserted}`);
    console.log(`Total in DB now:        ${finalCount}`);
    console.log('═'.repeat(50));

    if (shouldClean) {
      console.log('\n✅ Database cleaned and reloaded fresh!\n');
    } else {
      console.log('\n✅ Consolidation complete!\n');
      console.log('To clear all old questions and reload fresh, run:');
      console.log('  npm run consolidate:clean\n');
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
