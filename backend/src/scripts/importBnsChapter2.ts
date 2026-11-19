import 'dotenv/config';
import mongoose from 'mongoose';
import { Answer, Flashcard, FlashcardDeck, Paper, Question } from '../models';

const syllabusId = new mongoose.Types.ObjectId('6aa7d13ea2aa29e16ae68406');
const paperId = new mongoose.Types.ObjectId('6a7d4112e9afe7d3b640f6a0');

const items = [
  { key: 'c2-short-section4', topicKey: '102.u1.t4', type: 'SHORT', marks: 10, question: 'Explain the principal kinds of punishment recognised by Section 4 of the Bharatiya Nyaya Sanhita, 2023.', guQuestion: 'ભારતીય ન્યાય સંહિતા, 2023ની કલમ 4 હેઠળ માન્ય મુખ્ય સજાના પ્રકારો સમજાવો.', answer: 'Section 4 provides the general list of punishments: death, imprisonment for life, imprisonment, forfeiture of property, fine and community service. The answer should add that the particular offence provision determines which punishment is available and within what statutory limit. A punishment should never be added from a general note if the offence section does not authorise it.', guAnswer: 'કલમ 4માં મૃત્યુદંડ, આજીવન કેદ, કેદ, મિલકતની જપ્તી, દંડ અને સમુદાય સેવાનો સમાવેશ થતો સજાનો સામાન્ય આધાર આપવામાં આવ્યો છે. કયા ગુનામાં કઈ સજા લાગુ પડે છે તે સંબંધિત ગુનાની કલમ અને તેની વૈધાનિક મર્યાદા પરથી નક્કી થાય છે. ગુનાની કલમમાં અધિકૃત ન હોય તેવી સજા સામાન્ય નોંધ પરથી ઉમેરવી નહીં.' },
  { key: 'c2-long-framework', topicKey: '102.u1.t5', type: 'LONG', marks: 20, question: 'Explain the statutory framework of punishments under Sections 4 to 13 of the Bharatiya Nyaya Sanhita, 2023.', guQuestion: 'ભારતીય ન્યાય સંહિતા, 2023ની કલમ 4થી 13 હેઠળ સજાના વૈધાનિક માળખાની સમજૂતી આપો.', answer: 'Introduction: Sections 4 to 13 form the general sentencing framework. Section 4 lists the punishments. Sections 5 to 7 deal with commutation, calculation of fractions and the nature of imprisonment. Section 8 concerns fine and default liability. Sections 9 and 10 address limits where conduct involves several offences or the court is uncertain which offence was committed. Sections 11 and 12 regulate solitary confinement and its limits. Section 13 addresses enhanced punishment after a qualifying previous conviction. Conclusion: the offence provision, the punishment provision and the statutory limits must be read together.', guAnswer: 'પરિચય: કલમ 4થી 13 સજાનું સામાન્ય વૈધાનિક માળખું બનાવે છે. કલમ 4 સજાના પ્રકારો દર્શાવે છે. કલમ 5થી 7 સજાનું રૂપાંતર, અંશોની ગણતરી અને કેદના પ્રકાર સાથે સંબંધિત છે. કલમ 8 દંડ અને દંડ ન ભરાય ત્યારેની જવાબદારી અંગે છે. કલમ 9 અને 10 અનેક ગુનાઓ અથવા કયો ચોક્કસ ગુનો થયો તેની અનિશ્ચિતતા અંગેની મર્યાદા સમજાવે છે. કલમ 11 અને 12 એકાંત કેદ અને તેની મર્યાદા અંગે છે. કલમ 13 અગાઉની પાત્ર દોષસિદ્ધિ પછીની વધારાની સજા અંગે છે. ગુનાની કલમ, સજાની કલમ અને વૈધાનિક મર્યાદા સાથે વાંચવા જોઈએ.' },
  { key: 'c2-short-fine', topicKey: '102.u1.t5', type: 'SHORT', marks: 10, question: 'What points should be discussed when explaining fine and default liability under Section 8?', guQuestion: 'કલમ 8 હેઠળ દંડ અને દંડ ન ભરાય ત્યારેની જવાબદારી સમજાવતી વખતે કયા મુદ્દા લખવા જોઈએ?', answer: 'The answer should distinguish the fine imposed as punishment from imprisonment that may follow in default of payment. It should identify whether the offence provision fixes a minimum or maximum fine, whether fine is additional to imprisonment, and what default rule the statute permits. The exact limit must be taken from the applicable offence provision and not guessed.', guAnswer: 'જવાબમાં સજા તરીકે લાદવામાં આવતા દંડ અને દંડ ન ભરાય ત્યારે થઈ શકતી કેદ વચ્ચેનો તફાવત કરવો જોઈએ. સંબંધિત ગુનાની કલમમાં દંડની લઘુત્તમ અથવા મહત્તમ મર્યાદા છે કે નહીં, દંડ કેદ ઉપરાંત છે કે નહીં અને દંડ ન ભરાય ત્યારે કયો નિયમ લાગુ પડે છે તે લખવું જોઈએ. ચોક્કસ મર્યાદા લાગુ પડતી ગુનાની કલમમાંથી જ લેવી.' },
  { key: 'c2-mcq-section4', topicKey: '102.u1.t4', type: 'MCQ', marks: 1, question: 'Which section contains the general list of punishments under the BNS?', guQuestion: 'BNS હેઠળ સજાના સામાન્ય પ્રકારોની યાદી કઈ કલમમાં છે?', options: [{ label: 'A', text: 'Section 2' }, { label: 'B', text: 'Section 4' }, { label: 'C', text: 'Section 8' }, { label: 'D', text: 'Section 13' }], correct: 'B', answer: 'Section 4 contains the general list of punishments.', guAnswer: 'કલમ 4માં સજાના સામાન્ય પ્રકારોની યાદી આપવામાં આવી છે.', explanation: 'Section 4 opens Chapter II and identifies the principal punishments.' },
  { key: 'c2-mcq-solitary', topicKey: '102.u1.t5', type: 'MCQ', marks: 1, question: 'Which pair should be read together for solitary confinement?', guQuestion: 'એકાંત કેદ માટે કઈ કલમોની જોડી સાથે વાંચવી જોઈએ?', options: [{ label: 'A', text: 'Sections 4 and 5' }, { label: 'B', text: 'Sections 8 and 9' }, { label: 'C', text: 'Sections 11 and 12' }, { label: 'D', text: 'Sections 13 and 14' }], correct: 'C', answer: 'Sections 11 and 12 should be read together: one provides the rule and the other its limits.', guAnswer: 'કલમ 11 અને 12 સાથે વાંચવી જોઈએ: એકાંત કેદ અંગેની જોગવાઈ અને તેની મર્યાદા બંને સમજાય છે.', explanation: 'The two sections must be read together so that the enabling rule is not separated from its statutory limit.' },
  { key: 'c2-mcq-previous-conviction', topicKey: '102.u1.t5', type: 'MCQ', marks: 1, question: 'Section 13 is concerned with which subject?', guQuestion: 'કલમ 13 કયા વિષય સાથે સંબંધિત છે?', options: [{ label: 'A', text: 'Commutation of sentence' }, { label: 'B', text: 'Enhanced punishment after previous conviction' }, { label: 'C', text: 'Private defence' }, { label: 'D', text: 'Criminal conspiracy' }], correct: 'B', answer: 'Section 13 concerns enhanced punishment after a qualifying previous conviction.', guAnswer: 'કલમ 13 પાત્ર અગાઉની દોષસિદ્ધિ પછીની વધારાની સજા સાથે સંબંધિત છે.', explanation: 'A previous complaint or arrest is not the same as a qualifying previous conviction.' },
  { key: 'c2-mcq-doubtful-offence', topicKey: '102.u1.t5', type: 'MCQ', marks: 1, question: 'Which provision addresses doubt as to which one of several offences was committed?', guQuestion: 'અનેક ગુનાઓમાંથી કયો ગુનો થયો તે અંગેની શંકા કઈ કલમમાં આવરી લેવામાં આવે છે?', options: [{ label: 'A', text: 'Section 6' }, { label: 'B', text: 'Section 8' }, { label: 'C', text: 'Section 10' }, { label: 'D', text: 'Section 12' }], correct: 'C', answer: 'Section 10 addresses the situation in which one of several offences is certain but the particular offence is doubtful.', guAnswer: 'કલમ 10માં અનેક ગુનાઓમાંથી કોઈ એક ગુનો થયો હોવાનું નિશ્ચિત હોય પરંતુ કયો ચોક્કસ ગુનો થયો તે અંગે શંકા હોય તે સંજોગ આવરી લેવાયો છે.', explanation: 'The statutory approach should be applied instead of automatically choosing the harsher offence.' },
  { key: 'c2-mcq-fractions', topicKey: '102.u1.t4', type: 'MCQ', marks: 1, question: 'Which section is associated with fractions of terms of punishment?', guQuestion: 'સજાની અવધિના અંશો સાથે કઈ કલમ સંબંધિત છે?', options: [{ label: 'A', text: 'Section 5' }, { label: 'B', text: 'Section 6' }, { label: 'C', text: 'Section 7' }, { label: 'D', text: 'Section 9' }], correct: 'B', answer: 'Section 6 deals with fractions of terms of punishment.', guAnswer: 'કલમ 6 સજાની અવધિના અંશો સાથે સંબંધિત છે.', explanation: 'Section 6 is a calculation rule and should not be confused with remission or commutation.' },
];

async function main() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/llb');
  const syllabus = await mongoose.connection.db?.collection('syllabuses').findOne({ _id: syllabusId, status: 'published' });
  if (!syllabus) throw new Error('Published BNS syllabus not found');
  const paper = await Paper.findById(paperId);
  if (!paper) throw new Error('Existing Criminal Semester 1 paper not found');
  const deck = await FlashcardDeck.findOne({ subject: 'CRIMINAL', semester: 1 });
  if (!deck) throw new Error('Existing Criminal Semester 1 flashcard deck not found');
  let questionsCreated = 0; let answersCreated = 0; let cardsCreated = 0;
  for (let i = 0; i < items.length; i += 1) {
    const item = items[i];
    const sourceFingerprint = `bns-chapter-2-${item.key}`;
    let question = await Question.findOne({ sourceFingerprint });
    if (!question) {
      question = await Question.create({ paperId: paper._id, semester: 1, subject: 'CRIMINAL', questionNumber: `BNS-C2-${i + 1}`, type: item.type, marks: item.marks, questionText: item.question, options: item.options, correctAnswer: item.correct, difficulty: item.type === 'MCQ' ? 'EASY' : item.type === 'LONG' ? 'HARD' : 'MEDIUM', tags: ['BNS', 'Semester 1', 'Chapter 2', item.topicKey], source: { fileName: 'LLB_Sem1_BNS_Chapter2_શુદ્ધ_ગુજરાતી_માસ્ટર_250_MCQ.pdf', year: 2026, university: 'Gujarat University' }, extractionQuality: 100, sourceFingerprint, validationIssues: [], topicRefs: [{ syllabusId, syllabusVersion: 1, topicKey: item.topicKey }], reviewStatus: 'published', publishedAt: new Date() });
      questionsCreated += 1;
    }
    const answerRows = item.type === 'MCQ'
      ? [{ language: 'en', type: 'mcq', text: `${item.guAnswer}\n\nEnglish: ${item.answer}`, mcqExplanation: item.explanation, mcqOptions: item.options?.map((option) => ({ ...option, isCorrect: option.label === item.correct })) }]
      : [{ language: 'en', type: item.type === 'SHORT' ? 'short' : 'long', text: `${item.guAnswer}\n\nEnglish: ${item.answer}` }];
    for (const row of answerRows) {
      const existingAnswer = await Answer.findOne({ questionId: question._id, type: row.type, language: row.language });
      if (!existingAnswer) {
        await Answer.create({ questionId: question._id, paperId: paper._id, ...row, wordCount: row.text.length, keyPoints: [], casesReferred: [], actsReferred: [{ actName: 'Bharatiya Nyaya Sanhita, 2023', sections: [{ number: item.topicKey, title: 'BNS Chapter 2 topic', summary: 'Mapped to the published Semester 1 BNS syllabus.' }] }], studyTips: [], difficulty: item.type === 'LONG' ? 'hard' : item.type === 'SHORT' ? 'medium' : 'easy', generatedBy: 'manual', qualityScore: 9, verified: true, sources: [{ type: 'statute', title: 'The Bharatiya Nyaya Sanhita, 2023', year: 2023 }] });
        answersCreated += 1;
      } else if (item.type !== 'MCQ') {
        existingAnswer.text = row.text;
        existingAnswer.wordCount = row.text.length;
        existingAnswer.verified = true;
        await existingAnswer.save();
      }
    }
    if (!await Flashcard.findOne({ deckId: deck._id, sourceQuestionId: question._id })) {
      await Flashcard.create({ deckId: deck._id, sourceQuestionId: question._id, front: item.guQuestion, back: `${item.guAnswer}\n\nEnglish: ${item.answer}`, options: item.options?.map((option) => ({ ...option, explanation: option.label === item.correct ? item.explanation : undefined })), correctAnswer: item.correct, explanation: item.explanation, optionSource: item.type === 'MCQ' ? 'source' : undefined, optionStatus: item.type === 'MCQ' ? 'approved' : undefined, category: item.type === 'MCQ' ? 'section' : 'concept', topicId: item.topicKey, difficulty: item.type === 'LONG' ? 'hard' : item.type === 'SHORT' ? 'medium' : 'easy', tags: ['BNS', 'Semester 1', 'Chapter 2'], relatedCases: [], examples: [], mnemonics: '', isActive: true });
      cardsCreated += 1;
    }
  }
  deck.cardCount = await Flashcard.countDocuments({ deckId: deck._id, isActive: true }); await deck.save();
  console.log(JSON.stringify({ questionsCreated, answersCreated, cardsCreated, deckId: String(deck._id), cardCount: deck.cardCount }));
  await mongoose.disconnect();
}
main().catch(async (error) => { console.error(error); await mongoose.disconnect(); process.exitCode = 1; });
