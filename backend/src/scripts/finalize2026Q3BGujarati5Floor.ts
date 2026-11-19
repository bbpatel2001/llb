import dotenv from 'dotenv';
import { connectDB, disconnectDB } from '../config/database';
import { Answer } from '../models/Answer';
dotenv.config();
(async () => {
  await connectDB();
  try {
    const answer: any = await Answer.findOne({ questionId: '6af1be53286aaeb0b7d420f1', targetMarks: 5, language: 'gu' });
    if (!answer) throw new Error('Answer not found');
    const sentence = ' આ ઐતિહાસિક તફાવત પરીક્ષાના જવાબમાં સ્પષ્ટ રીતે દર્શાવવો જોઈએ.';
    if (!String(answer.text).includes(sentence.trim())) answer.text += sentence;
    answer.wordCount = String(answer.text).split(/\s+/).filter(Boolean).length;
    await answer.save();
    console.log(JSON.stringify({ wordCount: answer.wordCount }));
  } finally { await disconnectDB(); }
})().catch((error) => { console.error(error); process.exitCode = 1; });
