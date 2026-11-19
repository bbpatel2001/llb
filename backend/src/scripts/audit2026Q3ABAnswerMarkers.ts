import dotenv from 'dotenv';
import { connectDB, disconnectDB } from '../config/database';
import { Answer } from '../models/Answer';

dotenv.config();
(async () => {
  await connectDB();
  try {
    const rows: any[] = await Answer.find({ questionId: { $in: ['6af1be53286aaeb0b7d420ee', '6af1be53286aaeb0b7d420f1'] } })
      .select('questionId targetMarks language wordCount text')
      .sort({ questionId: 1, targetMarks: 1, language: 1 })
      .lean();
    for (const row of rows) {
      const markers = String(row.text).split(/\n/).filter((line) => /ADDITIONAL|ENHANCEMENT|વધારાનું|FINAL 5|25-MARK/i.test(line));
      console.log(JSON.stringify({ questionId: row.questionId, targetMarks: row.targetMarks, language: row.language, wordCount: row.wordCount, markers }));
    }
  } finally { await disconnectDB(); }
})().catch((error) => { console.error(error); process.exitCode = 1; });
