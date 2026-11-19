import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from '../config/database';
import { Paper } from '../models/Paper';
import { Question } from '../models/Question';
import { cleanStoredQuestionText } from '../services/questionTextCleanup';

dotenv.config();

function monthFromPaper(paper: any): string | undefined {
  const text = `${paper.title || ''} ${paper.fileName || ''}`;
  const match = text.match(/\b(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b/i);
  return match?.[1];
}

async function main() {
  await connectDB();
  try {
    const papers = await Paper.find({ semester: 1 }).lean();
    let paperCount = 0;
    for (const paper of papers) {
      const month = monthFromPaper(paper);
      if (month) {
        await Paper.updateOne({ _id: paper._id }, { $set: { examMonth: month } });
        paperCount += 1;
      }
    }

    const questions = await Question.find({ semester: 1 }).select('_id questionText').lean();
    let changed = 0;
    for (const question of questions) {
      const cleaned = cleanStoredQuestionText(question.questionText || '');
      if (cleaned && cleaned !== question.questionText) {
        await Question.updateOne({ _id: question._id }, { $set: { questionText: cleaned } });
        changed += 1;
      }
    }
    console.log(JSON.stringify({ papersWithMonth: paperCount, questionsCleaned: changed, questionsScanned: questions.length }));
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
