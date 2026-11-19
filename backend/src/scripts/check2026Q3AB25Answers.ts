import dotenv from 'dotenv';
import { connectDB, disconnectDB } from '../config/database';
import { Answer } from '../models/Answer';

dotenv.config();
const questionIds = [
  '6af1be53286aaeb0b7d420ee',
  '6af1be53286aaeb0b7d420f1',
];

(async () => {
  await connectDB();
  try {
    const rows = await Answer.find({ questionId: { $in: questionIds }, targetMarks: { $in: [20, 25] } })
      .select('questionId targetMarks language type wordCount reviewStatus verified')
      .sort({ questionId: 1, targetMarks: 1, language: 1 })
      .lean();
    console.log(JSON.stringify(rows, null, 2));
  } finally {
    await disconnectDB();
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
