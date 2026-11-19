import dotenv from 'dotenv';
import { connectDB, disconnectDB } from '../config/database';
import { Answer } from '../models/Answer';

dotenv.config();
const questionId = '6af1be53286aaeb0b7d420f1';
const additions: Record<string, string> = {
  'en5': `\n\nThe two plans also differed in their view of constitutional timing. The Cabinet Mission contemplated a gradual process through an Assembly and interim government. The Mountbatten Plan fixed a definite date and made legal instruments necessary for the transfer.`,
  'gu5': `\n\nબંને યોજનાઓના સમય અંગેના અભિગમમાં પણ તફાવત હતો. કેબિનેટ મિશન ધીમે ધીમે બંધારણ સભા અને વચગાળાની સરકાર દ્વારા પરિવર્તન લાવવા માગતું હતું. માઉન્ટબેટન યોજનાએ નિશ્ચિત તારીખ નક્કી કરી અને સત્તા હસ્તાંતરણ માટે કાયદાકીય સાધનો જરૂરી બનાવ્યાં.`,
  'en15': `\n\nA further distinction concerns the source of legitimacy. The Cabinet Mission tried to create legitimacy through Indian participation in constitution-making. Its Constituent Assembly proposal was therefore more than an administrative device: it recognised that the future constitutional order had to be discussed by Indian representatives. The Mountbatten Plan derived its immediate legal effect from the British Parliament's Indian Independence Act, although the political decision had been negotiated with Indian leaders.\n\nThe failure of the first plan should not be attributed to one clause alone. The Congress-League conflict, competing ideas of nationhood, communal fear, the weakness of the interim government and the violence of 1946 reinforced one another. Likewise, the Mountbatten Plan solved the immediate problem of British withdrawal but transferred unresolved questions to the two new states. This explains why its constitutional success and its social consequences must be examined together.`,
  'gu15': `\n\nકાયદાકીય માન્યતાના સ્ત્રોતમાં પણ બંને યોજનાઓ અલગ હતી. કેબિનેટ મિશન ભારતીય પ્રતિનિધિઓની ભાગીદારી દ્વારા બંધારણ રચવાની માન્યતા ઊભી કરવા માગતું હતું. તેથી બંધારણ સભા માત્ર વહીવટી સંસ્થા નહોતી; તે ભારતની ભાવિ બંધારણીય વ્યવસ્થા ભારતીય પ્રતિનિધિઓ ચર્ચા કરીને નક્કી કરે તે સ્વીકારતી સંસ્થા હતી. માઉન્ટબેટન યોજનાને તાત્કાલિક કાયદાકીય અસર બ્રિટિશ સંસદના ભારતીય સ્વતંત્રતા અધિનિયમમાંથી મળી, જોકે રાજકીય નિર્ણય ભારતીય નેતાઓ સાથેની વાટાઘાટો પછી લેવાયો હતો.

કેબિનેટ મિશનની નિષ્ફળતા માટે એક જ કલમ જવાબદાર નહોતી. કોંગ્રેસ અને લીગના રાષ્ટ્રવાદ અંગેના અલગ વિચારો, સામુદાયિક ભય, વચગાળાની સરકારની નબળાઈ, જૂથીકરણ અંગેના મતભેદ અને 1946ની હિંસા એકબીજાને મજબૂત કરતા ગયા. એ જ રીતે, માઉન્ટબેટન યોજનાએ બ્રિટિશ પ્રસ્થાનનો તાત્કાલિક પ્રશ્ન ઉકેલ્યો, પરંતુ બંને નવા દેશો માટે સરહદ, શરણાર્થી, સંપત્તિ અને લઘુમતી સુરક્ષા જેવા પ્રશ્નો છોડ્યા. તેથી તેની બંધારણીય સફળતા અને સામાજિક પરિણામો બંનેનું એકસાથે મૂલ્યાંકન કરવું જોઈએ.`,
};

(async () => {
  await connectDB();
  try {
    for (const targetMarks of [5, 15] as const) for (const language of ['en', 'gu'] as const) {
      const answer: any = await Answer.findOne({ questionId, targetMarks, language });
      const key = `${language}${targetMarks}`;
      if (!answer) throw new Error(`Missing ${key}`);
      if (!String(answer.text).includes('source of legitimacy') && !String(answer.text).includes('કાયદાકીય માન્યતાના સ્ત્રોત')) answer.text += additions[key];
      answer.wordCount = String(answer.text).split(/\s+/).filter(Boolean).length;
      answer.reviewStatus = 'review_required'; answer.verified = false;
      await answer.save();
      console.log(JSON.stringify({ targetMarks, language, wordCount: answer.wordCount }));
    }
  } finally { await disconnectDB(); }
})().catch((error) => { console.error(error); process.exitCode = 1; });
