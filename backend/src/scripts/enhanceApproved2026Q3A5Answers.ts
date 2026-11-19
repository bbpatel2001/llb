import dotenv from 'dotenv';
import { connectDB, disconnectDB } from '../config/database';
import { Answer } from '../models/Answer';

dotenv.config();
const questionId = '6af1be53286aaeb0b7d420ee';
const marker = 'ADDITIONAL 5-MARK EXPLANATION';
const extraMarker = 'ADDITIONAL 5-MARK CONCLUSION';
const addition = {
  en: `\n\n${marker}\n\nThe Drafting Committee also had to ensure that the language of the Constitution was clear and that the powers of each constitutional institution were properly defined. The Assembly considered the relationship between Fundamental Rights and the Directive Principles of State Policy. It also discussed how a strong Union could be combined with provincial autonomy. Adoption on 26 November 1949 gave the Constitution formal authority, while commencement on 26 January 1950 marked its practical operation as the Constitution of the Republic.`,
  gu: `\n\n${marker}\n\nમુસદ્દા સમિતિએ બંધારણની ભાષા સ્પષ્ટ રહે અને દરેક બંધારણીય સંસ્થાની સત્તાઓ યોગ્ય રીતે નક્કી થાય તેની કાળજી લીધી હતી. બંધારણ સભાએ મૂળભૂત અધિકારો અને રાજ્યના નીતિનિર્દેશક તત્ત્વો વચ્ચેના સંબંધ પર પણ વિચાર કર્યો હતો. મજબૂત કેન્દ્ર સાથે પ્રાંતીય સ્વાયત્તતા કેવી રીતે જાળવી શકાય તે અંગે ચર્ચા થઈ હતી. 26 નવેમ્બર, 1949ના રોજ સ્વીકારથી બંધારણને ઔપચારિક સત્તા મળી, જ્યારે 26 જાન્યુઆરી, 1950ના રોજ તેનો અમલ શરૂ થતાં પ્રજાસત્તાકનું બંધારણીય શાસન શરૂ થયું.`,
};
(async()=>{await connectDB(); try{for(const language of ['en','gu'] as const){const a:any=await Answer.findOne({questionId,targetMarks:5,language}); if(!a) throw new Error(`${language} answer not found`); if(!String(a.text).includes(marker)) a.text+=addition[language]; if(!String(a.text).includes(extraMarker)) a.text+=language==='en'?`\n\n${extraMarker}\n\nThe procedure therefore had three important features: Indian participation, open constitutional debate and a formal legal act of adoption. These features gave the Constitution legitimacy and helped establish the authority of the new Republic.`:`\n\n${extraMarker}\n\nઆ પ્રક્રિયાની ત્રણ મહત્વપૂર્ણ વિશેષતાઓ હતી: ભારતીય પ્રતિનિધિઓની ભાગીદારી, ખુલ્લી બંધારણીય ચર્ચા અને બંધારણનો ઔપચારિક કાયદાકીય સ્વીકાર. આ વિશેષતાઓથી બંધારણને લોકશાહી માન્યતા મળી અને નવા પ્રજાસત્તાકની સત્તા સ્થાપિત થઈ.`; a.wordCount=String(a.text).split(/\s+/).filter(Boolean).length; a.reviewStatus='review_required'; await a.save(); console.log(JSON.stringify({language,wordCount:a.wordCount}));}}finally{await disconnectDB();}})().catch(e=>{console.error(e);process.exitCode=1;});
