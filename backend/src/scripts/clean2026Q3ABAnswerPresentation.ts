import dotenv from 'dotenv';
import { connectDB, disconnectDB } from '../config/database';
import { Answer } from '../models/Answer';

dotenv.config();
const q3a = '6af1be53286aaeb0b7d420ee';
const markerLines = [
  'ADDITIONAL 5-MARK EXPLANATION',
  'ADDITIONAL 5-MARK CONCLUSION',
  'FINAL 5-MARK ENHANCEMENT',
  'ADDITIONAL 15-MARK ANALYSIS',
  'વધારાનું 15 ગુણનું વિશ્લેષણ',
  '25-MARK GUJARATI ENHANCEMENT',
];
const q3a25GujaratiAddition = `

બંધારણ સભાની ચર્ચાનો કાયદાકીય અર્થ

અંતિમ મુસદ્દાની કાયદાકીય ગુણવત્તા માત્ર કલમોની સંખ્યાથી નક્કી થતી નથી. દરેક કલમનો અન્ય કલમો સાથેનો સંબંધ, સત્તાની મર્યાદા, નાગરિકોના હકો અને ઉપચારની વ્યવસ્થા પણ મહત્વપૂર્ણ છે. સભાએ એવી વ્યવસ્થા ઊભી કરી કે સરકારની સત્તા કાયદાથી બંધાયેલી રહે અને નાગરિકો પોતાના હકોના રક્ષણ માટે ન્યાયતંત્રનો આશ્રય લઈ શકે. બંધારણીય ઉપચારનો અધિકાર આ વિચારનું પ્રતીક છે.

ફેડરલ માળખું અને સંસદીય જવાબદારી વચ્ચે સંતુલન રાખવું મુસદ્દા ઘડનારાઓ માટે મોટો પડકાર હતો. એક તરફ રાષ્ટ્રીય એકતા, સંરક્ષણ અને આર્થિક આયોજન માટે મજબૂત કેન્દ્ર જરૂરી હતું; બીજી તરફ રાજ્યો અને પ્રાંતોની સ્થાનિક જરૂરિયાતો અવગણાય નહીં તે પણ જરૂરી હતું. તેથી વિષયોની યાદીઓ, નાણાકીય સંબંધો, રાજ્યસભા, ન્યાયિક સમીક્ષા અને બંધારણીય સુધારાની વ્યવસ્થા દ્વારા સંતુલન બનાવાયું.

સ્વીકારની ઔપચારિક પ્રક્રિયા બંધારણની લોકશાહી માન્યતાને મજબૂત કરતી હતી. સભ્યોએ બંધારણને સ્વીકારતાં ભારતના લોકોના નામે સત્તા અને જવાબદારી જાહેર કરી. આથી બંધારણનું મૂળ સત્તાસ્રોત બ્રિટિશ સંસદ નહીં પરંતુ ભારતીય લોકો બન્યા. 26 નવેમ્બરનો સ્વીકાર અને 26 જાન્યુઆરીનો અમલ વચ્ચેનો સમય પ્રશાસનિક સંક્રમણ માટે પણ જરૂરી હતો. આ સમય દરમિયાન નવી સંસ્થાઓ અને રાજ્યવ્યવસ્થા માટે જરૂરી વ્યવસ્થા પૂર્ણ થઈ.

આ પ્રક્રિયાનું અંતિમ મૂલ્યાંકન કરતાં કહી શકાય કે બંધારણ સભાએ સંપૂર્ણ એકમત કરતાં વધુ મહત્વપૂર્ણ પદ્ધતિ અપનાવી: ચર્ચા, મતભેદ, સુધારો અને અંતે સંસ્થાકીય નિર્ણય. આ જ પ્રક્રિયાએ બંધારણને જીવંત અને અનુકૂલનક્ષમ દસ્તાવેજ બનાવ્યો. ડૉ. આંબેડકરનું નેતૃત્વ કેન્દ્રસ્થાને હતું, પરંતુ અંતિમ લખાણ સભાના સામૂહિક વિવેક, સમિતિઓના અહેવાલો અને લાંબા જાહેર-રાજકીય વિચારવિમર્શનું પરિણામ હતું.`;

(async () => {
  await connectDB();
  try {
    const rows: any[] = await Answer.find({ questionId: { $in: [q3a, '6af1be53286aaeb0b7d420f1'] } });
    for (const answer of rows) {
      let text = String(answer.text || '');
      for (const line of markerLines) text = text.replace(new RegExp(`^\\s*${line.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}\\s*$`, 'gim'), '');
      if (answer.questionId === q3a && answer.targetMarks === 25 && answer.language === 'gu' && !text.includes('બંધારણ સભાની ચર્ચાનો કાયદાકીય અર્થ')) text += q3a25GujaratiAddition;
      answer.text = text.replace(/\n{3,}/g, '\n\n').trim();
      answer.wordCount = answer.text.split(/\s+/).filter(Boolean).length;
      answer.reviewStatus = 'review_required';
      answer.verified = false;
      await answer.save();
      console.log(JSON.stringify({ questionId: answer.questionId, targetMarks: answer.targetMarks, language: answer.language, wordCount: answer.wordCount }));
    }
  } finally { await disconnectDB(); }
})().catch((error) => { console.error(error); process.exitCode = 1; });
