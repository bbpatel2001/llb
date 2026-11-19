import dotenv from 'dotenv';
import { connectDB, disconnectDB } from '../config/database';
import { Answer } from '../models/Answer';
dotenv.config();
(async () => {
  await connectDB();
  try {
    const answer: any = await Answer.findOne({ questionId: '6af1be53286aaeb0b7d420f1', targetMarks: 5, language: 'gu' });
    if (!answer) throw new Error('Gujarati 5-mark answer missing');
    const marker = 'બંધારણ સભાની રચના દ્વારા';
    if (!String(answer.text).includes(marker)) answer.text += `\n\nબંધારણ સભાની રચના દ્વારા ભારતીયોને પોતાના રાજકીય ભવિષ્ય અંગે નિર્ણય કરવાની તક મળી. તેથી પ્રથમ યોજના બંધારણ રચનાની પ્રક્રિયા શરૂ કરવા માટે મહત્વપૂર્ણ હતી. બીજી યોજના સ્વતંત્રતાને કાયદાકીય સ્વરૂપ આપતી હતી, પરંતુ વિભાજનના પરિણામે ઊભી થયેલી માનવીય મુશ્કેલીઓ પણ તેની સાથે જોડાયેલી રહી. આ તફાવત બંને યોજનાઓના સાચા મૂલ્યાંકન માટે યાદ રાખવો જોઈએ.`;
    answer.wordCount = String(answer.text).split(/\s+/).filter(Boolean).length;
    answer.reviewStatus = 'review_required'; answer.verified = false;
    await answer.save();
    console.log(JSON.stringify({ targetMarks: 5, language: 'gu', wordCount: answer.wordCount }));
  } finally { await disconnectDB(); }
})().catch((error) => { console.error(error); process.exitCode = 1; });
