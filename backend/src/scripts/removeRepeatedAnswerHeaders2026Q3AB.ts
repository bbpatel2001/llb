import dotenv from 'dotenv';
import { connectDB, disconnectDB } from '../config/database';
import { Answer } from '../models/Answer';

dotenv.config();
const questionIds = ['6af1be53286aaeb0b7d420ee', '6af1be53286aaeb0b7d420f1'];

function clean(text: string) {
  return text
    .replace(/^\s*(SUBJECT|TOPIC|YEAR):.*$/gim, '')
    .replace(/^\s*THE FINAL DRAFT AND PROCEDURE OF ADOPTION OF THE\s*$/gim, '')
    .replace(/^\s*CONSTITUTION OF INDIA\s*$/gim, '')
    .replace(/^\s*THE CABINET MISSION AND THE MOUNTBATTEN PLAN\s*$/gim, '')
    .replace(/^\s*Constitutional History of India\s*$/gim, '')
    .replace(/^\s*પ્રશ્ન[–-].*$/gim, '')
    .replace(/^\s*વિષય[:：].*$/gim, '')
    .replace(/^\s*ટોપિક[:：].*$/gim, '')
    .replace(/^\s*વર્ષ[:：].*$/gim, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

(async () => {
  await connectDB();
  try {
    const answers: any[] = await Answer.find({ questionId: { $in: questionIds } });
    for (const answer of answers) {
      answer.text = clean(String(answer.text || ''));
      answer.wordCount = answer.text.split(/\s+/).filter(Boolean).length;
      answer.reviewStatus = 'review_required';
      answer.verified = false;
      await answer.save();
      console.log(JSON.stringify({ questionId: answer.questionId, targetMarks: answer.targetMarks, language: answer.language, wordCount: answer.wordCount }));
    }
  } finally { await disconnectDB(); }
})().catch((error) => { console.error(error); process.exitCode = 1; });
