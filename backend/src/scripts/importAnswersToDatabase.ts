import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Answer } from '../models/Answer';
import { Question } from '../models/Question';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

interface AnswerData {
  questionNumber: string;
  questionText: string;
  marks: number;
  type: string;
  difficulty: string;
  tags: string[];
  answer: string;
  wordCount: number;
  keyPoints: string[];
  studyTips: string[];
}

function mapAnswerType(type: string): 'short' | 'long' | 'standard' | 'mcq' | 'case_study' {
  const normalizedType = type.toUpperCase();
  if (normalizedType === 'SHORT') return 'short';
  if (normalizedType === 'LONG') return 'long';
  if (normalizedType === 'MCQ') return 'mcq';
  if (normalizedType === 'CASE') return 'case_study';
  return 'standard';
}

async function importAnswers() {
  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║  IMPORTING ANSWERS TO DATABASE             ║');
  console.log('╚════════════════════════════════════════════╝\n');

  try {
    // Connect to database
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/llb-platform';
    console.log(`📡 Connecting to MongoDB: ${mongoUri.substring(0, 30)}...\n`);
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Get all answer files
    const answersDir = path.join(__dirname, '../data/answers');
    const answerFiles = fs.readdirSync(answersDir).filter(f => f.endsWith('.json'));

    console.log(`📁 Found ${answerFiles.length} answer files to import\n`);

    let totalImported = 0;
    let totalSkipped = 0;
    let totalErrors = 0;

    // Process each file
    for (const file of answerFiles) {
      const filePath = path.join(answersDir, file);
      console.log(`\n📄 Processing: ${file}`);
      console.log(`${'─'.repeat(50)}`);

      try {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const answers: AnswerData[] = JSON.parse(fileContent);

        console.log(`   Found ${answers.length} answers in file`);

        for (let i = 0; i < answers.length; i++) {
          const answerData = answers[i];

          try {
            // Find matching question in database
            const question = await Question.findOne({
              questionNumber: answerData.questionNumber,
            });

            if (!question) {
              console.log(`   ⚠️  Q${answerData.questionNumber}: Question not found in database`);
              totalSkipped++;
              continue;
            }

            // Check if answer already exists
            const existingAnswer = await Answer.findOne({
              questionId: question._id,
              type: answerData.type,
            });

            if (existingAnswer) {
              console.log(`   ⏭️  Q${answerData.questionNumber} (${answerData.type}): Already exists`);
              totalSkipped++;
              continue;
            }

            // Create and save answer
            const answerDoc = new Answer({
              questionId: question._id,
              type: mapAnswerType(answerData.type),
              text: answerData.answer,
              wordCount: answerData.wordCount,
              keyPoints: answerData.keyPoints,
              studyTips: answerData.studyTips,
              difficulty: answerData.difficulty.toLowerCase(),
              generatedBy: 'ai',
              qualityScore: 8,
              verified: false,
              sources: [
                {
                  type: 'article',
                  title: `Generated Answer - ${answerData.tags.join(', ')}`,
                  year: new Date().getFullYear(),
                },
              ],
            });

            await answerDoc.save();
            console.log(`   ✅ Q${answerData.questionNumber} (${answerData.type}): Imported`);
            totalImported++;
          } catch (err) {
            console.log(`   ❌ Q${answerData.questionNumber}: Error - ${(err as Error).message}`);
            totalErrors++;
          }
        }
      } catch (err) {
        console.error(`   ❌ File Error: ${(err as Error).message}`);
      }
    }

    console.log(`\n\n${'═'.repeat(50)}`);
    console.log('IMPORT SUMMARY');
    console.log(`${'═'.repeat(50)}`);
    console.log(`✅ Imported: ${totalImported}`);
    console.log(`⏭️  Skipped: ${totalSkipped}`);
    console.log(`❌ Errors:  ${totalErrors}`);
    console.log(`${'═'.repeat(50)}\n`);

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB\n');
  } catch (error) {
    console.error('❌ Critical Error:', error);
    process.exit(1);
  }
}

importAnswers();
