import dotenv from 'dotenv';
import { connectDB, disconnectDB } from '../config/database';
import { Paper } from '../models/Paper';
import { Question } from '../models/Question';
import { canonicalSemester1Subject } from '../utils/semester1Subjects';

dotenv.config();
(async () => {
  await connectDB();
  try {
    const papers: any[] = await Paper.find({ semester: 1 }).select('_id subject').lean();
    const questions: any[] = await Question.find({ semester: 1 }).select('_id subject').lean();
    let paperUpdates = 0;
    let questionUpdates = 0;
    for (const paper of papers) {
      const subject = canonicalSemester1Subject(paper.subject);
      if (subject && subject !== paper.subject) { await Paper.updateOne({ _id: paper._id }, { $set: { subject } }); paperUpdates += 1; }
    }
    for (const question of questions) {
      const subject = canonicalSemester1Subject(question.subject);
      if (subject && subject !== question.subject) { await Question.updateOne({ _id: question._id }, { $set: { subject } }); questionUpdates += 1; }
    }
    console.log(JSON.stringify({ semester: 1, paperUpdates, questionUpdates }, null, 2));
  } finally { await disconnectDB(); }
})().catch((error) => { console.error(error); process.exitCode = 1; });
