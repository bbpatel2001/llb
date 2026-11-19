import dotenv from 'dotenv';
import { connectDB, disconnectDB } from '../config/database';
import { Answer } from '../models/Answer';
import { Question } from '../models/Question';

dotenv.config();
const questionId = '6af1be53286aaeb0b7d420f1';

const text = {
  en5: `The Cabinet Mission and the Mountbatten Plan were two important constitutional attempts during the final phase of British rule in India. The Cabinet Mission came to India in 1946 to preserve Indian unity, establish a Constituent Assembly and arrange an interim government. It proposed a Union dealing mainly with defence, foreign affairs and communications, while the provinces retained other powers. It also proposed grouping provinces and creating a Constituent Assembly through indirect election. The plan failed because Congress and the Muslim League interpreted the grouping provisions differently and could not agree on the powers of the centre.

Lord Mountbatten became Viceroy in 1947 and accepted partition as the practical solution to the political deadlock. His 3 June Plan provided for the partition of British India, boundary commissions for Punjab and Bengal, the creation of India and Pakistan as independent Dominions, and transfer of power on 15 August 1947. The Plan became the basis of the Indian Independence Act, 1947. Thus, the Cabinet Mission tried to preserve a united India, whereas the Mountbatten Plan enabled a rapid transfer of power through partition.`,
  gu5: `કેબિનેટ મિશન અને માઉન્ટબેટન યોજના બ્રિટિશ શાસનના અંતિમ તબક્કાની બે મહત્વપૂર્ણ બંધારણીય યોજનાઓ હતી. કેબિનેટ મિશન 1946માં ભારતની એકતા જાળવવા, બંધારણ સભા રચવા અને વચગાળાની સરકાર બનાવવાના હેતુથી આવ્યું. તેણે સંરક્ષણ, વિદેશી બાબતો અને સંચાર જેવા મર્યાદિત વિષયો માટે ભારતીય સંઘ અને બાકીની સત્તાઓ ધરાવતા પ્રાંતોની યોજના રજૂ કરી. કોંગ્રેસ અને મુસ્લિમ લીગ જૂથીકરણ અને કેન્દ્રની સત્તા અંગે સહમત ન થતાં આ યોજના નિષ્ફળ ગઈ.

1947માં લોર્ડ માઉન્ટબેટને વિભાજનને વ્યવહારુ ઉકેલ તરીકે સ્વીકાર્યું. 3 જૂનની યોજનામાં ભારતના વિભાજન, પંજાબ અને બંગાળ માટે સરહદ પંચ, ભારત અને પાકિસ્તાન નામના બે ડોમિનિયન અને 15 ઑગસ્ટ, 1947ના રોજ સત્તા હસ્તાંતરણની જોગવાઈ હતી. આ યોજના ભારતીય સ્વતંત્રતા અધિનિયમ, 1947નો આધાર બની. આમ, કેબિનેટ મિશન અખંડ ભારત જાળવવા માગતું હતું, જ્યારે માઉન્ટબેટન યોજનાએ વિભાજન દ્વારા ઝડપી સ્વતંત્રતાનો માર્ગ ખોલ્યો.`,
  en15: `The Cabinet Mission Plan of 1946 and the Mountbatten Plan of 1947 were different responses to the constitutional crisis created by the conflict between the Indian National Congress and the Muslim League. The Cabinet Mission sought to transfer power while preserving the unity of India. The Mountbatten Plan accepted partition when negotiations for a united constitutional arrangement had broken down.

The Cabinet Mission consisted of Lord Pethick-Lawrence, Sir Stafford Cripps and A. V. Alexander. It arrived in India in March 1946 and consulted the principal political parties and other interests. Its proposals of 16 May 1946 contemplated an Indian Union consisting of British Indian provinces and princely states. The Union was to control defence, foreign affairs and communications, together with the finances necessary for those subjects. Residuary powers were to remain with the provinces. Provinces were to be arranged in three groups: Group A, consisting mainly of provinces in the south and centre; Group B, consisting of Punjab, the North-West Frontier Province and Sind; and Group C, consisting of Bengal and Assam.

The Plan also proposed a Constituent Assembly. Members from the provinces were to be elected by the provincial legislatures through proportional representation and the princely states were to send representatives after consultation. An interim government was proposed until the new constitutional system came into operation. The League initially accepted the Plan because grouping could provide political strength to Muslim-majority provinces. Congress accepted the idea of a Constituent Assembly but did not accept that provinces could be compelled to remain in groups. This difference, together with disagreement about the strength of the Union, destroyed the possibility of cooperation. The League later withdrew its acceptance and Direct Action was followed by serious communal violence.

Lord Mountbatten was appointed Viceroy in 1947 with instructions to complete the transfer of power. His 3 June Plan accepted that Congress and the League could not work within one constitutional arrangement. It provided for the partition of British India, the division of Punjab and Bengal where required, boundary commissions, the end of British paramountcy over princely states, and the creation of India and Pakistan as independent Dominions. Power was transferred on 15 August 1947. The Indian Independence Act, 1947 gave the Plan legal effect and authorised the division of administrative and financial assets.

The two plans therefore differed in aim and method. The Cabinet Mission was a negotiated federal compromise intended to preserve unity through a weak Union and strong provinces. The Mountbatten Plan was a settlement based on partition and a fixed timetable. The first plan contributed to the creation of the Constituent Assembly even though it failed as a political settlement. The second achieved independence but caused displacement, communal violence, division of assets and continuing disputes. A balanced answer must recognise both the constitutional achievement and the human cost of the final transfer of power.`,
  gu15: `1946ની કેબિનેટ મિશન યોજના અને 1947ની માઉન્ટબેટન યોજના ભારતના બંધારણીય સંકટ માટેના બે અલગ ઉકેલો હતા. કોંગ્રેસ અને મુસ્લિમ લીગ વચ્ચેના મતભેદને કારણે બ્રિટિશ સરકારને એવી યોજના શોધવી પડી કે જેના દ્વારા સત્તા ભારતીયોને સોંપી શકાય. કેબિનેટ મિશન અખંડ ભારત જાળવવા માગતું હતું, જ્યારે માઉન્ટબેટન યોજનાએ વાટાઘાટો નિષ્ફળ થયા પછી વિભાજન સ્વીકાર્યું.

કેબિનેટ મિશનમાં લોર્ડ પેથિક-લોરેન્સ, સર સ્ટેફર્ડ ક્રિપ્સ અને એ. વી. એલેક્ઝાન્ડર હતા. તે માર્ચ 1946માં ભારત આવ્યું અને કોંગ્રેસ, મુસ્લિમ લીગ, શીખો, દેશી રજવાડાં તથા અન્ય પ્રતિનિધિઓ સાથે ચર્ચા કરી. 16 મે, 1946ની યોજનામાં બ્રિટિશ ભારતના પ્રાંતો અને દેશી રાજ્યોને સમાવીને ભારતીય સંઘ રચવાની ભલામણ કરવામાં આવી. સંઘ પાસે સંરક્ષણ, વિદેશી બાબતો અને સંચાર જેવા વિષયો રહેવાના હતા તથા આ વિષયો માટે જરૂરી નાણાકીય સત્તા પણ સંઘ પાસે રહેવાની હતી. બાકીની અને અવશેષ સત્તાઓ પ્રાંતો પાસે રહેવાની હતી.

પ્રાંતોને ત્રણ જૂથોમાં ગોઠવવાની યોજના હતી. જૂથ Aમાં મુખ્યત્વે મધ્ય અને દક્ષિણ ભારતના પ્રાંતો, જૂથ Bમાં પંજાબ, ઉત્તર-પશ્ચિમ સરહદી પ્રાંત અને સિંધ તથા જૂથ Cમાં બંગાળ અને આસામનો સમાવેશ થતો હતો. આ જૂથીકરણ મુસ્લિમ લીગને મુસ્લિમ બહુમતીવાળા પ્રદેશો માટે રાજકીય સુરક્ષા આપતું લાગ્યું, પરંતુ કોંગ્રેસને કેન્દ્ર નબળું પડવાની અને પ્રાંતોને બળજબરીથી જૂથમાં રાખવાની ચિંતા હતી.

યોજનાએ બંધારણ સભાની રચનાની પણ ભલામણ કરી. પ્રાંતીય ધારાસભાઓ દ્વારા પ્રમાણસર પ્રતિનિધિત્વથી સભ્યો ચૂંટવાના હતા અને દેશી રાજ્યોને પ્રતિનિધિત્વ આપવાનું હતું. નવી વ્યવસ્થા આવે ત્યાં સુધી વચગાળાની સરકાર રચવાની હતી. મુસ્લિમ લીગે શરૂઆતમાં યોજના સ્વીકારી, પરંતુ જૂથીકરણ ફરજિયાત છે કે નહીં અને બંધારણ સભા પોતાની રીતે નિર્ણય લઈ શકે કે નહીં તે અંગે મતભેદ થયા. પરિણામે લીગે સ્વીકાર પાછો ખેંચ્યો અને ડાયરેક્ટ એક્શન પછી સામુદાયિક હિંસા વધી.

1947માં લોર્ડ માઉન્ટબેટન વાઇસરોય બન્યા. 3 જૂનની માઉન્ટબેટન યોજનાએ ભારતના વિભાજનને સ્વીકાર્યું. તેમાં પંજાબ અને બંગાળના જરૂરી વિભાજન, સરહદ પંચ, દેશી રજવાડાંઓ ઉપર બ્રિટિશ સર્વોચ્ચ સત્તાનો અંત અને ભારત તથા પાકિસ્તાન નામના બે સ્વતંત્ર ડોમિનિયનની રચના કરવાની જોગવાઈ હતી. 15 ઑગસ્ટ, 1947ના રોજ સત્તા હસ્તાંતરણ થયું. ભારતીય સ્વતંત્રતા અધિનિયમ, 1947એ આ નિર્ણયને કાયદાકીય સ્વરૂપ આપ્યું.

બંને યોજનાઓ વચ્ચેનો મુખ્ય તફાવત એ છે કે કેબિનેટ મિશન સંઘીય સમાધાન અને અખંડ ભારતના પક્ષમાં હતું, જ્યારે માઉન્ટબેટન યોજના વિભાજન અને નિશ્ચિત સમયમર્યાદા પર આધારિત હતી. કેબિનેટ મિશન નિષ્ફળ ગયું, પરંતુ તેની બંધારણ સભા સંબંધિત ભલામણથી ભારતીય બંધારણ રચનાનો માર્ગ ખુલ્યો. માઉન્ટબેટન યોજનાથી સ્વતંત્રતા મળી, પરંતુ સ્થળાંતર, હિંસા, સંપત્તિ વિભાજન અને શરણાર્થી સંકટ જેવી ગંભીર માનવીય મુશ્કેલીઓ ઊભી થઈ. તેથી બંને યોજનાઓનું મૂલ્યાંકન કરતી વખતે બંધારણીય પરિણામ સાથે તેની ઐતિહાસિક અને માનવીય અસર પણ સમજવી જોઈએ.`,
} as const;

const guides = {
  5: { answerType: 'short' as const, marks: 5, targetPages: 'approximately 1 A4 page', targetWords: '350–500 words', sections: ['Introduction', 'Cabinet Mission', 'Mountbatten Plan', 'Conclusion'] },
  15: { answerType: 'long' as const, marks: 15, targetPages: 'approximately 2–3 A4 pages', targetWords: '900–1,200 words', sections: ['Background', 'Cabinet Mission proposals', 'Reasons for failure', 'Mountbatten Plan', 'Comparison and conclusion'] },
};

async function save(language: 'en' | 'gu', targetMarks: 5 | 15, answerText: string, paperId: any) {
  const guide = guides[targetMarks];
  await Answer.findOneAndUpdate(
    { questionId, targetMarks, language },
    { $set: { questionId, paperId, type: targetMarks === 5 ? 'short' : 'long', targetMarks, language, text: answerText, wordCount: answerText.split(/\s+/).filter(Boolean).length, keyPoints: guide.sections, studyTips: ['Use separate headings for both plans', 'State the dates and legal instrument accurately', 'Compare the aims and consequences in the conclusion'], writingGuide: { ...guide, include: ['Question-specific chronology', 'Main constitutional provisions', 'Critical comparison'], statutoryProvisions: ['Indian Independence Act, 1947'], caseExamples: [] }, difficulty: targetMarks === 5 ? 'medium' : 'hard', generatedBy: 'manual', qualityScore: 8, verified: false, reviewStatus: 'review_required', sources: [{ type: 'article', title: 'Semester 1 Constitutional History answer source material' }] } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  return answerText.split(/\s+/).filter(Boolean).length;
}

(async () => {
  await connectDB();
  try {
    const question: any = await Question.findById(questionId).lean();
    if (!question) throw new Error('Q3(B) not found');
    const imported = [
      { targetMarks: 5 as const, language: 'en' as const, text: text.en5 },
      { targetMarks: 5 as const, language: 'gu' as const, text: text.gu5 },
      { targetMarks: 15 as const, language: 'en' as const, text: text.en15 },
      { targetMarks: 15 as const, language: 'gu' as const, text: text.gu15 },
    ];
    const results = [];
    for (const row of imported) results.push({ ...row, wordCount: await save(row.language, row.targetMarks, row.text, question.paperId) });
    console.log(JSON.stringify(results.map(({ targetMarks, language, wordCount }) => ({ targetMarks, language, wordCount })), null, 2));
  } finally { await disconnectDB(); }
})().catch((error) => { console.error(error); process.exitCode = 1; });
