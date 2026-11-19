import dotenv from 'dotenv';
import { connectDB, disconnectDB } from '../config/database';
import { Question, IQuestion } from '../models/Question';
import { Answer } from '../models/Answer';
import AnswerGenerationService from '../services/answerGenerationService';
import AnswerGuidanceService from '../services/answerGuidanceService';

dotenv.config();

const dryRun = !process.argv.includes('--apply');
const semesterArg = process.argv.find((arg) => arg.startsWith('--semester='));
const semester = semesterArg ? Number(semesterArg.split('=')[1]) : undefined;
const includeGujarati = process.argv.includes('--gujarati');

function isPlaceholder(answer: any): boolean {
  if (answer?.type === 'case_study' && Array.isArray(answer.questions) && answer.questions.length > 0) return false;
  if (answer?.type === 'mcq' && Array.isArray(answer.mcqOptions) && answer.mcqOptions.length > 0) return false;
  const text = String(answer?.text || answer?.answer || '').trim();
  const source = String(answer?.sources?.[0]?.title || '');
  return text.length < 80 || /^Generated Answer\s*-/i.test(source) || /^(Original question paper required for MCQ answer key|મૂળ પ્રશ્નપત્રથી MCQ જવાબની ચકાસણી જરૂરી)/i.test(source) || /^This question requires a comprehensive answer covering:/i.test(text);
}

function answerTypeFor(question: IQuestion): 'short' | 'long' | 'standard' | 'mcq' | 'case_study' {
  // Some imported papers label explanatory sub-questions as MCQ. If there are
  // no options/key, treat an "Explain/Discuss" prompt as an answerable written
  // question instead of publishing an empty MCQ review notice.
  if (question.type === 'MCQ' && !(question.options?.length && question.correctAnswer) && /\b(explain|discuss|describe|write|state)\b/i.test(question.questionText)) {
    return question.marks <= 5 ? 'short' : 'long';
  }
  if (question.type === 'MCQ') return 'mcq';
  if (question.type === 'CASE_STUDY') return 'case_study';
  if (question.type === 'SHORT' || question.marks <= 5) return 'short';
  if (question.type === 'DESCRIPTIVE') return 'standard';
  return 'long';
}

async function createOrRepair(question: IQuestion, type: ReturnType<typeof answerTypeFor>, language: 'en' | 'gu') {
  const existing = await Answer.find({ questionId: question._id, language: language === 'en' ? { $in: ['en', null] } : language }).sort({ updatedAt: -1 });
  const matching = existing.find((answer) => answer.type === type);
  // Any AI-generated record may have been created by an older generic
  // generator with a different source label. Rebuild it; preserve only
  // manual/source-backed records.
  const needsGuidanceRefresh = matching?.generatedBy === 'ai';
  const usable = matching && !isPlaceholder(matching) && !needsGuidanceRefresh;
  if (usable) return { action: 'kept' as const };

  if (dryRun) return { action: matching ? 'wouldRepair' as const : 'wouldAdd' as const };

  if (type === 'mcq') {
    if (question.options?.length && question.correctAnswer) {
      if (language === 'en') {
        await AnswerGenerationService.generateMCQAnswer(question._id.toString());
      } else {
        const mcqOptions = question.options.map((opt) => ({
          label: opt.label as 'A' | 'B' | 'C' | 'D',
          text: opt.text,
          isCorrect: opt.label === question.correctAnswer,
          explanation: opt.label === question.correctAnswer ? 'આ વિકલ્પ સાચો જવાબ છે.' : 'આ વિકલ્પ સાચો જવાબ નથી.',
        }));
        const text = `સાચો જવાબ: ${question.correctAnswer}. વિકલ્પો અને પ્રશ્નના કાનૂની સંદર્ભને મૂળ સ્રોત સાથે ચકાસો.`;
        const payload = {
          questionId: question._id,
          paperId: question.paperId,
          type: 'mcq' as const,
          language,
          text,
          wordCount: text.split(/\s+/).filter(Boolean).length,
          mcqOptions,
          mcqExplanation: 'યોગ્ય વિકલ્પ પસંદ કરવા માટે પ્રશ્નમાં દર્શાવેલી કાનૂની જોગવાઈ અને તેના તત્ત્વો તપાસો.',
          keyPoints: ['સાચો વિકલ્પ અને લાગુ કાનૂની જોગવાઈ'],
          studyTips: ['મૂળ પ્રશ્નપત્ર અને લાગુ કાયદા સાથે જવાબની ચકાસણી કરો.'],
          difficulty: question.marks <= 5 ? 'easy' as const : 'medium' as const,
          generatedBy: 'ai' as const,
          qualityScore: 7,
          verified: false,
          reviewStatus: 'review_required' as const,
          sources: [{ type: 'article' as const, title: 'Question-specific Gujarati MCQ answer guidance' }],
        };
        if (matching) await Answer.updateOne({ _id: matching._id }, { $set: payload });
        else await Answer.create(payload);
      }
    } else {
      const text = language === 'gu'
        ? 'આ પ્રશ્ન બહુવિકલ્પીય પ્રશ્ન તરીકે આયાત થયો છે, પરંતુ મૂળ સ્રોતમાં વિકલ્પો અથવા સાચો જવાબ ઉપલબ્ધ નથી. સાચો જવાબ પ્રકાશિત કરતા પહેલાં મૂળ પ્રશ્નપત્રની ચકાસણી આવશ્યક છે.'
        : 'This question was imported as an MCQ, but its answer options or answer key were not present in the extracted source. Review the original question paper before publishing the correct answer.';
      const payload = {
        questionId: question._id,
        paperId: question.paperId,
        type: 'mcq',
        language,
        text,
        wordCount: text.split(/\s+/).length,
        keyPoints: [language === 'gu' ? 'વિકલ્પો અને જવાબની મૂળ પ્રશ્નપત્રથી ચકાસણી જરૂરી છે' : 'Answer options or answer key require source-paper review'],
        studyTips: [language === 'gu' ? 'મૂળ પ્રશ્નપત્ર તપાસીને વિકલ્પો અને સાચો જવાબ દાખલ કરો.' : 'Check the original question paper and enter the verified options and correct answer.'],
        difficulty: 'medium',
        generatedBy: 'ai',
        qualityScore: 0,
        verified: false,
        reviewStatus: 'review_required',
        sources: [{ type: 'article', title: language === 'gu' ? 'મૂળ પ્રશ્નપત્રથી MCQ જવાબની ચકાસણી જરૂરી' : 'Original question paper required for MCQ answer key' }],
      };
      if (matching) await Answer.updateOne({ _id: matching._id }, { $set: payload });
      else await Answer.create(payload);
    }
    return { action: matching ? 'repaired' as const : 'added' as const };
  }
  if (type === 'case_study') {
    if (language === 'en') await AnswerGenerationService.generateCaseStudyAnswer(question._id.toString());
    else {
      const text = AnswerGuidanceService.buildAnswerText(question, 'long', 'gu');
      await Answer.updateOne({ questionId: question._id, type: 'case_study', language }, { $set: {
        questionId: question._id, paperId: question.paperId, type: 'case_study', language,
        text, wordCount: text.split(/\s+/).filter(Boolean).length, caseScenario: question.questionText,
        questions: [{ subQuestion: 'મુખ્ય કાનૂની મુદ્દો શું છે?', expectedAnswer: text, marks: question.marks || 10 }],
        generatedBy: 'ai', qualityScore: 7, verified: false, reviewStatus: 'review_required',
        sources: [{ type: 'article', title: 'Question-specific Gujarati answer guidance' }],
      } }, { upsert: true });
    }
    return { action: matching ? 'repaired' as const : 'added' as const };
  }

  const answerType = type === 'short' ? 'short' : 'long';
  const text = AnswerGuidanceService.buildAnswerText(question, answerType, language);
  const guide = AnswerGuidanceService.buildWritingGuide(question, answerType, language);
  const payload = {
    questionId: question._id,
    paperId: question.paperId,
    type,
    language,
    text,
    wordCount: text.split(/\s+/).filter(Boolean).length,
    keyPoints: guide.sections,
    studyTips: AnswerGuidanceService.buildStudyTips(question, answerType),
    writingGuide: guide,
    difficulty: question.marks <= 5 ? 'easy' : question.marks <= 15 ? 'medium' : 'hard',
    generatedBy: 'ai',
    qualityScore: 7,
    verified: false,
    reviewStatus: 'review_required',
    sources: [{ type: 'article', title: language === 'gu' ? 'Question-specific Gujarati answer guidance' : 'Question-specific answer guidance' }],
  };

  if (matching) await Answer.updateOne({ _id: matching._id }, { $set: payload });
  else await Answer.create(payload);
  return { action: matching ? 'repaired' as const : 'added' as const };
}

async function main() {
  await connectDB();
  try {
    const questionFilter = semester ? { semester } : {};
    const questions = await Question.find(questionFilter).sort({ semester: 1, subject: 1, questionNumber: 1 });
    const questionIds = questions.map((question) => question._id);
    const allAnswers = await Answer.find({ questionId: { $in: questionIds } }).lean();
    const trackedQuestionIds = new Set(allAnswers.map((answer) => String(answer.questionId)));
    const usableByQuestion = new Map<string, number>();
    for (const answer of allAnswers) {
      if (!isPlaceholder(answer)) {
        const key = String(answer.questionId);
        usableByQuestion.set(key, (usableByQuestion.get(key) || 0) + 1);
      }
    }
    const totals = { kept: 0, added: 0, repaired: 0, wouldAdd: 0, wouldRepair: 0 };
    const unresolved: string[] = [];

    for (const question of questions) {
      try {
        const languages: Array<'en' | 'gu'> = includeGujarati ? ['en', 'gu'] : ['en'];
        for (const language of languages) {
          const result = await createOrRepair(question, answerTypeFor(question), language);
          totals[result.action] += 1;
        }
      } catch (error) {
        unresolved.push(`${question._id} ${question.questionNumber}: ${(error as Error).message}`);
      }
    }

    const noUsableAnswer = questions.filter((question) => !usableByQuestion.has(String(question._id)));
    const noAnswerRecord = questions.filter((question) => !trackedQuestionIds.has(String(question._id)));
    const mcqNeedsSourceReview = allAnswers.filter((answer: any) => String(answer.sources?.[0]?.title || '').startsWith('Original question paper required for MCQ answer key')).length;
    const sourceBacked = allAnswers.filter((answer: any) => answer.generatedBy === 'manual' && !isPlaceholder(answer)).length;
    console.log(JSON.stringify({
      dryRun,
      semester: semester || 'all',
      includeGujarati,
      totalQuestions: questions.length,
      questionsWithUsableAnswer: questions.length - noUsableAnswer.length,
      noUsableAnswer: noUsableAnswer.length,
      questionsWithoutAnyAnswerRecord: noAnswerRecord.length,
      mcqRecordsNeedingSourceReview: mcqNeedsSourceReview,
      noUsableSample: noUsableAnswer.slice(0, 10).map((question) => ({
        id: String(question._id),
        type: question.type,
        marks: question.marks,
        questionNumber: question.questionNumber,
        answerTypes: allAnswers.filter((answer) => String(answer.questionId) === String(question._id)).map((answer) => answer.type),
      })),
      sourceBackedAnswerRecords: sourceBacked,
      totals,
      unresolved,
    }, null, 2));
  } finally {
    await disconnectDB();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

