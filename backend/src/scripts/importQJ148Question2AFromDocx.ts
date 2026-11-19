import fs from 'fs';
import dotenv from 'dotenv';
import { connectDB, disconnectDB } from '../config/database';
import { Question } from '../models/Question';
import { Answer } from '../models/Answer';

dotenv.config();

type Language = 'en' | 'gu';
type Marks = 5 | 15 | 25;
type ExtractedAnswers = Record<'en5' | 'gu5' | 'en15' | 'gu15' | 'en25' | 'gu25', string>;

const extractedPath = 'C:/Users/xeevi/Documents/Codex/2026-11-15/http-localhost-6001-papers-6af1b72081165bd6c32ae808-http/work/q2a_docx_answers.json';
const answers = JSON.parse(fs.readFileSync(extractedPath, 'utf8')) as ExtractedAnswers;

const wordCount = (text: string) => text.trim().split(/\s+/u).filter(Boolean).length;

async function main() {
  await connectDB();
  try {
    const question = await Question.findOne({
      questionNumber: '2(A)',
      questionText: /absolute liability/i,
    });
    if (!question) throw new Error('Question 2(A) not found');

    const records: Array<{ language: Language; marks: Marks; text: string }> = [];
    for (const language of ['en', 'gu'] as const) {
      for (const marks of [5, 15, 25] as const) {
        records.push({ language, marks, text: answers[`${language}${marks}` as keyof ExtractedAnswers] });
      }
    }

    for (const { language, marks, text } of records) {
      await Answer.findOneAndUpdate(
        { questionId: question._id, type: marks === 5 ? 'short' : 'long', targetMarks: marks, language },
        {
          $set: {
            questionId: question._id,
            paperId: question.paperId,
            type: marks === 5 ? 'short' : 'long',
            targetMarks: marks,
            language,
            text,
            wordCount: wordCount(text),
            keyPoints: ['Rylands v. Fletcher', 'Strict Liability', 'Absolute Liability', 'M.C. Mehta v. Union of India', 'Exceptions'],
            studyTips: [],
            difficulty: marks === 5 ? 'medium' : 'hard',
            generatedBy: 'manual',
            qualityScore: 10,
            verified: true,
            reviewStatus: 'approved',
            reviewNotes: 'Imported from the supplied bilingual DOCX without generated filler text.',
            sources: [{ type: 'case_law', title: 'Absolute Liability – Rylands v. Fletcher (supplied bilingual answer)' }],
          },
          $unset: {
            formattedContent: 1,
            writingGuide: 1,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
    }

    // Remove the earlier generic answer record, which had no marks value and
    // contained generated writing-guide material unrelated to the DOCX.
    await Answer.deleteMany({
      questionId: question._id,
      $or: [{ targetMarks: { $exists: false } }, { targetMarks: null }],
    });

    console.log(JSON.stringify({
      questionId: String(question._id),
      imported: records.map(({ language, marks, text }) => ({ language, marks, words: wordCount(text) })),
    }, null, 2));
  } finally {
    await disconnectDB();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
