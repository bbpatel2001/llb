import dotenv from 'dotenv';
import { connectDB, disconnectDB } from '../config/database';
import { Answer } from '../models/Answer';

dotenv.config();
const questionId = '6af1be53286aaeb0b7d420ee';
const marker = 'FINAL 5-MARK ENHANCEMENT';

const additions = {
  en: `\n\n${marker}\n\nThe final Constitution was thus the result of a deliberate drafting and approval process, not merely a document prepared by one committee.`,
  gu: `\n\n${marker}\n\nઆથી અંતિમ બંધારણ માત્ર એક સમિતિએ તૈયાર કરેલો દસ્તાવેજ ન હતો. તે બંધારણ સભાની સઘન ચર્ચા, સૂચનો, સુધારાઓ અને ઔપચારિક સ્વીકારની સંયુક્ત પ્રક્રિયાનું પરિણામ હતું. આ પ્રક્રિયાએ બંધારણમાં લોકશાહી પ્રતિનિધિત્વ, કાયદાનું શાસન, મૂળભૂત અધિકારો, રાજ્યની જવાબદારી અને સત્તાના બંધારણીય વિભાજન જેવા મૂળભૂત સિદ્ધાંતોને સ્થાન આપ્યું. સ્વીકારની તારીખ અને અમલની તારીખ અલગ રાખવાથી બંધારણ સભાએ નવા રાજ્યના સંક્રમણને પણ વ્યવસ્થિત બનાવ્યું. તેથી બંધારણની રચનાની પ્રક્રિયા ભારતની લોકશાહી વ્યવસ્થાની કાયદાકીય અને રાજકીય પાયારચના ગણાય છે.`,
} as const;

(async () => {
  await connectDB();
  try {
    for (const language of ['en', 'gu'] as const) {
      const answer: any = await Answer.findOne({ questionId, targetMarks: 5, language });
      if (!answer) throw new Error(`${language} answer not found`);
      if (!String(answer.text).includes(marker)) answer.text += additions[language];
      answer.wordCount = String(answer.text).split(/\s+/).filter(Boolean).length;
      answer.reviewStatus = 'review_required';
      await answer.save();
      console.log(JSON.stringify({ language, wordCount: answer.wordCount }));
    }
  } finally {
    await disconnectDB();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
