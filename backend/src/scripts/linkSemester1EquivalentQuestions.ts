import dotenv from 'dotenv';
import { connectDB, disconnectDB } from '../config/database';
import { Paper } from '../models/Paper';
import { Question } from '../models/Question';

dotenv.config();

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
}

async function main() {
  await connectDB();
  try {
    const papers = await Paper.find({ semester: 1 }).select('_id fileName').lean();
    const paperIds = papers.filter((paper) => !/^semester1-syllabus-working-blueprint/i.test(paper.fileName || '')).map((paper) => paper._id);
    const questions = await Question.find({ semester: 1, paperId: { $in: paperIds }, reviewStatus: { $ne: 'rejected' } }).select('_id subject questionText').lean();
    const groups = new Map<string, typeof questions>();
    for (const question of questions) {
      // The same subject has legacy names in older imports (for example
      // “Foundation-106F” versus “106F”), so the question wording is the
      // reliable key for an exact repeated exam question.
      const key = normalize(question.questionText);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(question);
    }

    const equivalentGroups = [...groups.values()].filter((group) => group.length > 1);
    let linksCreated = 0;
    for (const group of equivalentGroups) {
      const ids = group.map((question) => question._id);
      for (const question of group) {
        const related = ids.filter((id) => String(id) !== String(question._id));
        const result = await Question.updateOne({ _id: question._id }, { $addToSet: { relatedQuestionIds: { $each: related } } });
        linksCreated += result.modifiedCount;
      }
    }
    console.log(JSON.stringify({ semester: 1, universityPaperQuestions: questions.length, equivalentGroups: equivalentGroups.length, linksCreated, groups: equivalentGroups.map((group) => group.map((question) => ({ id: String(question._id), subject: question.subject, text: question.questionText }))) }, null, 2));
  } finally { await disconnectDB(); }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
