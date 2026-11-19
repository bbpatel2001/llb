import dotenv from 'dotenv';
import { connectDB, disconnectDB } from '../config/database';
import { Answer } from '../models/Answer';

dotenv.config();
(async () => {
  await connectDB();
  try {
    const rows = await Answer.find({ questionId: '6af1be53286aaeb0b7d420ee' })
      .select('targetMarks language type wordCount reviewStatus verified')
      .sort({ targetMarks: 1, language: 1 })
      .lean();
    console.log(JSON.stringify(rows, null, 2));
  } finally {
    await disconnectDB();
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
