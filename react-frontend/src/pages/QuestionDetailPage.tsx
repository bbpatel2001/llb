import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Answer, AnswerWritingGuide, Question } from '@/types';
import { answersApi, questionsApi } from '@/lib/api';
import { ErrorMessage, LoadingSpinner } from '@/components';
import { StudyActions } from '@/components/StudyActions';
import { AdminTopicMapping } from '@/components/AdminTopicMapping';
import { AnswerReviewPanel } from '@/components/Answers/AnswerReviewPanel';
import { formatMarks, getErrorMessage } from '@/lib/utils';
import { useLocale } from '@/context/LocaleContext';
import { CheckCircle2, Wand2, BookOpen, Lightbulb } from 'lucide-react';

function FormattedAnswer({ text }: { text: string }) {
  const rawBlocks = text.split(/\n{2,}/).map((block) => block.trim()).filter(Boolean);
  const cleanMarkdown = (value: string) => value.replace(/__(.*?)__/g, '$1').trim();
  const isTableBlock = (value: string) => value.split('\n').filter(Boolean).every((line) => /^\s*\|.*\|\s*$/.test(line));
  const isListStart = (value: string) => /^\s*(?:[-*•]|\d+[.)])\s+/.test(value);
  const isHeadingBlock = (value: string) => {
    const line = value.split('\n').map((item) => item.trim()).filter(Boolean).join(' ');
    const withoutMarkdown = line.replace(/^#{1,4}\s+/, '').replace(/\*\*(.*?)\*\*/g, '$1').trim();
    if (!withoutMarkdown || withoutMarkdown.length > 120 || /[.!?]$/.test(withoutMarkdown)) return false;
    if (/^#{1,4}\s+/.test(line)) return true;
    if (/^[A-Z][A-Z\s:&()'’\-]{4,}$/.test(withoutMarkdown)) return true;
    const titleCase = (candidate: string) => candidate.split(/\s+/).every((word) => {
      const plain = word.replace(/^[^A-Za-z]+|[^A-Za-z'’]+$/g, '');
      return !plain || /^[A-Z][A-Za-z'’]*$/.test(plain) || /^(and|or|of|the|to|in|on|for|with|from|as|by|vs)$/i.test(plain);
    });
    if (/^\d+[.)]\s+/.test(withoutMarkdown)) return !/:/.test(withoutMarkdown) && withoutMarkdown.length < 90 && titleCase(withoutMarkdown.replace(/^\d+[.)]\s+/, ''));
    return /^[A-Z][^.!?]{2,90}$/.test(withoutMarkdown) && withoutMarkdown.split(/\s+/).length <= 12 && titleCase(withoutMarkdown);
  };
  const blocks: string[] = [];
  for (const block of rawBlocks) {
    const previous = blocks[blocks.length - 1];
    const blockIsTable = isTableBlock(block);
    const previousIsTable = Boolean(previous) && isTableBlock(previous);
    const canMerge = Boolean(previous)
      && !blockIsTable
      && !previousIsTable
      && !isHeadingBlock(previous)
      && !isHeadingBlock(block)
      && !isListStart(block)
      && (!/[.!?:;]$/.test(previous.trim()) || /^[a-z(]/.test(block.trim()) || isListStart(previous));
    if (canMerge) blocks[blocks.length - 1] += ` ${block}`;
    else if (blockIsTable && previousIsTable) blocks[blocks.length - 1] += `\n${block}`;
    else blocks.push(block);
  }
  const renderInlineMarkdown = (value: string) => {
    const parts = value.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, partIndex) => part.startsWith('**') && part.endsWith('**')
      ? <strong key={partIndex}>{part.slice(2, -2)}</strong>
      : <span key={partIndex}>{part}</span>);
  };
  return (
    <div className="space-y-4">
      {blocks.map((block, index) => {
        const rawLines = block.split('\n').map((line) => line.trim()).filter(Boolean);
        const lines = rawLines.map((line) => cleanMarkdown(line).replace(/^#{1,4}\s+/, '')).filter(Boolean);
        const first = lines[0] || '';
        const isTable = lines.length >= 2 && lines.every((line) => /^\|.*\|$/.test(line));
        const isHeading = isHeadingBlock(block);
        if (isTable) {
          const rows = lines.filter((line) => !/^\|\s*:?-{2,}/.test(line)).map((line) => line.replace(/^\||\|$/g, '').split('|').map((cell) => cell.trim()));
          return <div key={index} className="overflow-x-auto"><table className="min-w-full border-collapse border border-gray-300 text-sm"><thead><tr>{(rows[0] || []).map((cell, cellIndex) => <th key={cellIndex} className="border border-gray-300 bg-gray-100 px-3 py-2 text-left font-semibold text-gray-900">{renderInlineMarkdown(cell)}</th>)}</tr></thead><tbody>{rows.slice(1).map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={cellIndex} className="border border-gray-300 px-3 py-2 align-top text-gray-700">{renderInlineMarkdown(cell)}</td>)}</tr>)}</tbody></table></div>;
        }
        if (isHeading) {
          return <h3 key={index} className="pt-2 text-base font-bold text-gray-900">{renderInlineMarkdown(first)}</h3>;
        }
        const isNumberedItem = /^\d+[.)]\s+/.test(first);
        return <p key={index} className={`leading-8 text-gray-700 ${isNumberedItem ? 'pl-6 -indent-6' : ''}`}>{renderInlineMarkdown(lines.join(' '))}</p>;
      })}
    </div>
  );
}

function FormattedBlocks({ blocks }: { blocks: NonNullable<Answer['formattedContent']> }) {
  return <div className="space-y-4">{blocks.map((block, index) => {
    if (block.type === 'line') return <hr key={index} className="my-5 border-gray-200" />;
    if (block.type === 'table') return <div key={index} className="overflow-x-auto"><table className="min-w-full border-collapse border border-gray-300 text-sm"><thead><tr>{(block.rows?.[0] || []).map((cell, cellIndex) => <th key={cellIndex} className="border border-gray-300 bg-gray-100 p-3 text-left font-semibold">{cell.replace(/\*\*(.*?)\*\*/g, '$1')}</th>)}</tr></thead><tbody>{(block.rows || []).slice(1).map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={cellIndex} className="border border-gray-300 p-3 align-top">{cell.replace(/\*\*(.*?)\*\*/g, '$1')}</td>)}</tr>)}</tbody></table></div>;
    if (block.type === 'heading') return <h3 key={index} className="pt-2 text-lg font-bold text-gray-900">{block.text}</h3>;
    if (block.type === 'bold') return <p key={index} className="leading-8 font-bold text-gray-800">{block.text}</p>;
    return <p key={index} className="leading-8 text-gray-700">{block.text}</p>;
  })}</div>;
}

function localizedSubject(subject: string, locale: string): string {
  if (locale !== 'gu') return subject;
  if (/constitutional history/i.test(subject)) return 'ફાઉન્ડેશન-106F ભારતનો બંધારણીય ઇતિહાસ';
  return ({
    CONSTITUTIONAL: 'બંધારણીય ઇતિહાસ',
    CRIMINAL: 'ફોજદારી કાયદો',
    CONTRACT: 'કરારનો કાયદો',
    TORTS: 'ટોર્ટનો કાયદો',
    GENERAL: 'સામાન્ય કાયદાકીય અભ્યાસ',
  } as Record<string, string>)[subject] || subject;
}

function localizedMonth(month: string, locale: string): string {
  if (locale !== 'gu') return month;
  return ({ January: 'જાન્યુઆરી', February: 'ફેબ્રુઆરી', March: 'માર્ચ', April: 'એપ્રિલ', May: 'મે', June: 'જૂન', July: 'જુલાઈ', August: 'ઑગસ્ટ', September: 'સપ્ટેમ્બર', October: 'ઑક્ટોબર', November: 'નવેમ્બર', December: 'ડિસેમ્બર' } as Record<string, string>)[month] || month;
}

function localizedType(type: string, locale: string): string {
  if (locale !== 'gu') return type;
  return ({ LONG: 'વિસ્તૃત જવાબ', SHORT: 'ટૂંકો જવાબ', MCQ: 'બહુવિકલ્પી પ્રશ્ન', CASE_STUDY: 'કેસ અભ્યાસ', DESCRIPTIVE: 'વર્ણનાત્મક પ્રશ્ન' } as Record<string, string>)[type] || type;
}

function localizedDifficulty(difficulty: string, locale: string): string {
  if (locale !== 'gu') return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
  return ({ easy: 'સરળ', medium: 'મધ્યમ', hard: 'કઠિન' } as Record<string, string>)[difficulty] || difficulty;
}

function answerPlanForMarks(marks: number): string {
  if (marks <= 5) return 'approximately 1 A4 page · 350–500 words';
  if (marks <= 15) return 'approximately 2–3 A4 pages · 900–1,200 words';
  if (marks <= 20) return 'approximately 3–4 A4 pages · 1,300–1,600 words';
  return 'approximately 4–5 A4 pages · 1,600–2,200 words';
}

type AnswerMarkBand = '5' | '15' | '20-25';

function answerMarkBand(marks: number): AnswerMarkBand {
  if (marks <= 5) return '5';
  if (marks <= 15) return '15';
  return '20-25';
}

function answerBandLabel(band: AnswerMarkBand, locale: string): string {
  const words: Record<AnswerMarkBand, string> = { '5': '350–500', '15': '900–1,200', '20-25': '1,600–2,200' };
  const marks = band === '20-25' ? '20/25' : band;
  return locale === 'gu' ? `${marks} ગુણ, ${words[band]} શબ્દો` : `${marks} Marks, ${words[band]} words`;
}

function compactExamDate(month: string | undefined, year: number | undefined): string {
  const abbreviations: Record<string, string> = {
    january: 'Jan', february: 'Feb', march: 'Mar', april: 'Apr', may: 'May', june: 'Jun',
    july: 'Jul', august: 'Aug', september: 'Sep', october: 'Oct', november: 'Nov', december: 'Dec',
  };
  const shortMonth = month ? (abbreviations[month.toLowerCase()] || month.slice(0, 3)) : '';
  return year ? `${shortMonth}-${year}` : '';
}

function AnswerWritingGuidePanel({
  guide,
  title = 'How to write this answer',
  marksLabel,
}: {
  guide: AnswerWritingGuide;
  title?: string;
  marksLabel?: string;
}) {
  return (
    <div className="bg-blue-50 rounded-lg p-5 border border-blue-200">
      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm">
        <span className="h-2 w-2 rounded-full bg-blue-600" />
        {title}
      </h4>
      <p className="text-sm text-blue-900 mb-3">
        {marksLabel || guide.marks} marks | {guide.targetPages} | {guide.targetWords}
      </p>
      <ol className="space-y-2 text-sm text-gray-700 list-decimal list-inside">
        {guide.sections.map((section) => <li key={section}>{section}</li>)}
      </ol>
      {(guide.statutoryProvisions.length > 0 || guide.caseExamples.length > 0) && (
        <div className="mt-4 border-t border-blue-200 pt-3 text-sm text-gray-700">
          <p className="font-semibold text-gray-900 mb-2">Use these question-related authorities</p>
          <ul className="space-y-1 list-disc list-inside">
            {[...guide.statutoryProvisions.slice(0, 3), ...guide.caseExamples.slice(0, 2)].map((reference) => (
              <li key={reference}>{reference}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

const shortQuestionSteps = [
  'Start with a direct definition or answer to the exact question.',
  'State the governing legal provision and explain the essential ingredients.',
  'Use one or two relevant authorities and connect them to the issue.',
  'Finish with a concise conclusion. Use the mark-specific length shown for this question.',
];

const longQuestionSteps = [
  'Read the command word and identify the precise legal issue.',
  'Write an introduction, define the topic, and set out the scope of the answer.',
  'Explain the statutory framework, ingredients, classifications, and exceptions.',
  'Analyse leading cases and apply their principles to the question facts.',
  'Address counter-arguments, remedies, limitations, or critical evaluation where relevant.',
  'End with a reasoned conclusion that directly answers the question. Use the mark-specific length shown for this question.',
];

function normalizeAnswerText(value?: string): string {
  if (!value) return '';
  const lines = value.replace(/\r/g, '').split('\n');
  const output: string[] = [];
  let paragraph = '';
  const flush = () => {
    if (paragraph.trim()) output.push(paragraph.trim());
    paragraph = '';
  };
  const isStandalone = (line: string) => (
    /^#{1,4}\s/.test(line)
    || /^(PART\s+[IVX]+|INTRODUCTION|CONCLUSION|CRITICAL EVALUATION|KEY POINTS|IMPORTANT DATES)\b/i.test(line)
    || /^[A-Z][A-Z\s:&()'’,-]{4,}$/.test(line)
    || /^([-*•]|\d+[.)])\s+/.test(line)
    || /^\|/.test(line)
  );
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      flush();
      if (output.length && output[output.length - 1] !== '') output.push('');
    } else if (isStandalone(line)) {
      flush();
      output.push(line);
    } else {
      paragraph = paragraph ? `${paragraph} ${line}` : line;
    }
  }
  flush();
  return output.join('\n\n').replace(/\n{3,}/g, '\n\n').trim();
}

export function QuestionDetailPage() {
  const { questionId } = useParams<{ questionId: string }>();
  const { locale, t } = useLocale();
  console.log('🔄 QuestionDetailPage rendered with questionId:', questionId);
  const [question, setQuestion] = useState<Question | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [languageFallback, setLanguageFallback] = useState(false);
  const [loading, setLoading] = useState(true);
  const [preparing, setPreparing] = useState(false);
  const [activeAnswerBand, setActiveAnswerBand] = useState<AnswerMarkBand>('20-25');
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'prepare' | 'answer'>('answer');
  const [activePrepareTab, setActivePrepareTab] = useState<'short' | 'long'>('short');

  useEffect(() => {
    if (!questionId) return;
    console.log('📝 QuestionDetailPage: Loading question', questionId);
    Promise.all([questionsApi.getById(questionId), answersApi.getByQuestion(questionId, locale)])
      .then(([questionResponse, answerResponse]) => {
        console.log('✅ Question API Response:', questionResponse);
        console.log('✅ Answers API Response:', answerResponse);
        const q = questionResponse.data?.question || questionResponse.data;
        const a = answerResponse.data?.answers || answerResponse.data?.data?.answers || [];
        setLanguageFallback(Boolean(answerResponse.data?.languageFallback));
        console.log('📌 Extracted question:', q);
        console.log('📌 Extracted answers:', a);
        setQuestion(q);
        setAnswers(a);
      })
      .catch((err) => {
        console.error('❌ Error loading question:', err);
        setError(getErrorMessage(err));
      })
      .finally(() => setLoading(false));
  }, [locale, questionId]);

  const prepareAnswer = async (kind: 'short' | 'long') => {
    if (!questionId) return;
    try {
      setPreparing(true); setError(null);
      const response = kind === 'short' ? await answersApi.generateShort(questionId, locale) : await answersApi.generateLong(questionId, locale);
      setAnswers((current) => [...current.filter((answer) => answer.type !== kind), response.data.answer]);
    } catch (err) { setError(getErrorMessage(err)); }
    finally { setPreparing(false); }
  };

  if (loading) {
    console.log('⏳ Still loading...');
    return <LoadingSpinner />;
  }
  if (error) {
    console.log('❌ Error:', error);
    return <ErrorMessage message={error} />;
  }
  if (!question) {
    console.error('❌ No question found - question is null');
    return (
      <div className="p-8 bg-red-100 text-red-900 rounded-lg">
        <h2 className="text-2xl font-bold">{t('questionNotFound')}</h2>
        <p className="mt-2">{t('questionLoadError')}</p>
        <p className="mt-4 font-mono text-sm">questionId: {questionId}</p>
      </div>
    );
  }

  const shortAnswer = answers.find((answer) => answer.type === 'short' && answer.targetMarks === 5)
    || answers.find((answer) => answer.type === 'short');
  const longAnswers = answers.filter((answer) => answer.type === 'long');
  // Prefer a matched, formatted source answer over a generic generated duplicate.
  // Fall back to the most substantial answer when no formatted source exists.
  const latestLongAnswer = [...longAnswers].sort((a, b) => {
    const sourceWeight = (answer: Answer) => (answer.formattedContent?.length ? 100000 : 0) + (answer.wordCount || 0);
    return sourceWeight(b) - sourceWeight(a);
  })[0];
  const fifteenMarkAnswer = longAnswers.find((answer) => answer.targetMarks === 15)
    || longAnswers.find((answer) => answer.targetMarks == null);
  const twentyTwentyFiveMarkAnswer = longAnswers.find((answer) => answer.targetMarks === 20)
    || longAnswers.find((answer) => answer.targetMarks === 25)
    || latestLongAnswer;
  // The answer tab must also display substantive short answers. This matters
  // for imported papers whose written 5-mark prompt was incorrectly labelled
  // as MCQ and therefore has no long-answer record.
  const answerForBand = activeAnswerBand === '5'
    ? shortAnswer
    : activeAnswerBand === '15'
      ? fifteenMarkAnswer
      : activeAnswerBand === '20-25' ? twentyTwentyFiveMarkAnswer : undefined;
  const activeAnswerType = activeAnswerBand === '5' ? 'short' : 'long';
  const selectedBandMatchesQuestion = answerMarkBand(question.marks || 0) === activeAnswerBand;
  const primaryAnswer = answerForBand;
  const displayAnswers = primaryAnswer ? [primaryAnswer] : [];
  const answerFormatCount = new Set(
    answers.map((answer) => answer.targetMarks ?? (answer.type === 'short' ? 5 : answer.type === 'long' ? 25 : answer.type)),
  ).size;
  const displayQuestionText = locale === 'gu' ? (question.questionTextGu || question.questionText) : question.questionText;
  const repeatedExamOccurrences = Array.from(new Set([
    question.paper?.year ? compactExamDate(question.paper.examMonth, question.paper.year) : '',
    ...(question.relatedQuestions || []).map((related) => related.paper?.year ? compactExamDate(related.paper.examMonth, related.paper.year) : ''),
  ].filter(Boolean))).sort((a, b) => Number(b.match(/\d{4}/)?.[0] || 0) - Number(a.match(/\d{4}/)?.[0] || 0));
  const shortGuide = shortAnswer?.writingGuide;
  const shortInclusions = shortGuide?.include?.slice(0, 4) ?? [
    t('directAnswer'),
    t('legalTerminology'),
    t('keyProvisions'),
    t('concise'),
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Question Header */}
      <div>
        <article className="rounded-lg border-l-4 border-blue-600 bg-blue-50 px-6 py-5">
          <h1 className="text-2xl font-semibold leading-relaxed text-gray-900 whitespace-pre-wrap">
            {t('question')} {question.questionNumber} : {displayQuestionText}
          </h1>
          {repeatedExamOccurrences.length > 1 && (
            <p className="mt-3 text-sm font-semibold text-indigo-800">
              {t('askedInExams', { count: repeatedExamOccurrences.length, dates: repeatedExamOccurrences.join(', ') })}
            </p>
          )}
        </article>
        <p className="text-gray-600 mt-3">{t('semester')} {question.semester} · {localizedSubject(question.subject, locale)} · {localizedType(question.type, locale)}</p>
        <div className="mt-3 flex flex-wrap gap-2 text-sm">
          <span className="rounded-full bg-blue-50 px-3 py-1 font-semibold text-blue-800">{t('marks')}: {formatMarks(question.marks || 0)}</span>
          {question.paper?.year && <span className="rounded-full bg-gray-100 px-3 py-1 text-gray-700">{t('year')}: {question.paper.year}</span>}
          {question.paper?.examMonth && <span className="rounded-full bg-gray-100 px-3 py-1 text-gray-700">{t('month')}: {localizedMonth(question.paper.examMonth, locale)}</span>}
          {question.paper?.university && <span className="rounded-full bg-gray-100 px-3 py-1 text-gray-700">{t('university')}: {question.paper.university}</span>}
        </div>
      </div>

      {question.relatedQuestions && question.relatedQuestions.length > 0 && (
        <section className="rounded-lg border border-indigo-200 bg-indigo-50 p-5">
          <h2 className="text-lg font-semibold text-gray-900">{t('repeatedQuestions')}</h2>
          <p className="mt-1 text-sm text-gray-700">{t('repeatedQuestionsDescription')}</p>
          <div className="mt-3 space-y-2">
            {question.relatedQuestions.map((related) => (
              <Link key={related._id} to={`/questions/${related._id}`} className="block rounded-md border border-indigo-100 bg-white p-3 hover:border-indigo-400">
                <div className="text-sm font-semibold text-indigo-800">Question {related.questionNumber} · {related.paper?.examMonth || ''} {related.paper?.year || ''}</div>
                <div className="mt-1 text-sm text-gray-800">{locale === 'gu' ? (related.questionTextGu || related.questionText) : related.questionText}</div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Study actions */}
      <StudyActions targetType="question" targetId={question._id} />
      <AdminTopicMapping question={question} onSaved={(topicRefs) => setQuestion((current) => current ? { ...current, topicRefs } : current)} />

      {/* Tab Navigation */}
      <div className="bg-white rounded-t-lg shadow border-b flex">
        <button
          onClick={() => setActiveTab('prepare')}
          className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
            activeTab === 'prepare'
              ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <Lightbulb className="h-5 w-5" />
          <span>{t('howToWrite')}</span>
        </button>
        <button
          onClick={() => setActiveTab('answer')}
          className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
            activeTab === 'answer'
              ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <BookOpen className="h-5 w-5" />
          <span>{t('answers')} ({answerFormatCount})</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-b-lg shadow">
        {/* How to Write Tab - Shows SHORT ANSWER */}
        {activeTab === 'prepare' && (
          <div className="p-8 space-y-6">
            <div className="flex flex-wrap gap-2 border-b" role="tablist" aria-label="How to Write sections">
              <button
                type="button"
                role="tab"
                aria-selected={activePrepareTab === 'short'}
                onClick={() => setActivePrepareTab('short')}
                className={`border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
                  activePrepareTab === 'short'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-900'
                }`}
              >
                Short Question
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activePrepareTab === 'long'}
                onClick={() => setActivePrepareTab('long')}
                className={`border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
                  activePrepareTab === 'long'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-900'
                }`}
              >
                Long Question
              </button>
            </div>
            {activePrepareTab === 'short' && (
              <div className="space-y-6" role="tabpanel">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">📝 {t('shortAnswerExample')}</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {answerPlanForMarks(question.marks || 0)}
                </p>
              </div>
            </div>

            <div className="rounded-lg bg-amber-50 border border-amber-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-2">How to Write a Short Question Answer</h3>
              <p className="text-sm text-amber-900 mb-3">Use the mark-specific target shown above, with the important provisions and relevant case examples.</p>
              <ol className="space-y-2 text-sm text-gray-800 list-decimal list-inside">
                {shortQuestionSteps.map((step) => <li key={step}>{step}</li>)}
              </ol>
            </div>

            {answers.length > 0 && shortAnswer ? (
              <div className="space-y-4">
                {/* Answer Card */}
                <div className="border-l-4 border-amber-500 bg-white rounded-lg shadow-md overflow-hidden">
                  {/* Header */}
                  <div className="bg-gradient-to-r from-amber-50 to-yellow-50 px-6 py-4 border-b-2 border-amber-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg">✓ {t('shortAnswer')} ({question.marks || 5} {t('marks')})</h3>
                        <p className="text-sm text-gray-600 mt-1">{t('conciseAnswerDescription')}</p>
                      </div>
                      <span className="text-3xl">📖</span>
                    </div>
                  </div>

                  {/* What to Include Box */}
                  <div className="px-6 py-4 bg-blue-50 border-b border-blue-200">
                    <p className="font-semibold text-blue-900 text-sm mb-3">💡 {t('whatMakesAnswerGood')}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {shortInclusions.map((inclusion) => (
                        <div key={inclusion} className="flex gap-2 text-sm text-blue-800">
                          <span className="text-blue-600 font-bold">✓</span>
                          <span>{inclusion}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actual Answer Text */}
                  <div className="px-6 py-6 bg-white">
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{t('realAnswerContent')}</p>
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-gray-800 leading-relaxed text-sm whitespace-pre-wrap font-serif">
                        {normalizeAnswerText(shortAnswer?.text || shortGuide?.modelAnswer || shortAnswer?.answer)}
                      </div>
                    </div>
                  </div>

                  {/* Key Points Section */}
                  {(shortAnswer?.keyPoints?.length ?? 0) > 0 && (
                    <div className="px-6 py-4 bg-green-50 border-t border-green-200">
                      <h4 className="font-semibold text-green-900 mb-3 text-sm flex items-center gap-2">
                        <span className="text-lg">🎯</span>
                        {t('keyElements')}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {(shortAnswer?.keyPoints ?? []).map((point, idx) => (
                          <div key={idx} className="flex gap-2 text-sm text-green-800">
                            <span className="text-green-600 font-bold flex-shrink-0">✓</span>
                            <span>{point}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Study Tips */}
                  {(shortAnswer?.studyTips?.length ?? 0) > 0 && (
                    <div className="px-6 py-4 bg-purple-50 border-t border-purple-200">
                      <h4 className="font-semibold text-purple-900 mb-3 text-sm flex items-center gap-2">
                        <span className="text-lg">💡</span>
                        {t('similarAnswerTips')}
                      </h4>
                      <ul className="space-y-2">
                        {(shortAnswer?.studyTips ?? []).map((tip, idx) => (
                          <li key={idx} className="flex gap-2 text-sm text-purple-800">
                            <span className="text-purple-600 font-bold flex-shrink-0">•</span>
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Note at bottom */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-sm text-amber-900">
                    <strong>📌 Note:</strong> {t('examNote')}
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-8 text-center">
                <p className="text-2xl mb-3">📝</p>
                <p className="text-amber-900 font-semibold">{t('noShortAnswer')}</p>
                <p className="text-amber-800 text-sm mt-2">{t('prepareShortFirst')}</p>
              </div>
            )}
          </div>
        )}

        {activePrepareTab === 'long' && (
          <div className="space-y-6" role="tabpanel">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">How to Answer Long Question</h2>
                <p className="text-sm text-gray-600 mt-1">{locale === 'gu' ? `લક્ષ્ય લંબાઈ: ${answerPlanForMarks(question.marks || 0)}, વિગતવાર કાયદાકીય વિશ્લેષણ અને સંબંધિત કેસ ઉદાહરણો સાથે.` : `Target length: ${answerPlanForMarks(question.marks || 0)}, with detailed legal analysis and relevant case examples.`}</p>
              </div>
            </div>

            <div className="rounded-lg bg-blue-50 border border-blue-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-2">Long Question Writing Structure</h3>
              <ol className="space-y-2 text-sm text-gray-800 list-decimal list-inside">
                {longQuestionSteps.map((step) => <li key={step}>{step}</li>)}
              </ol>
            </div>

            {latestLongAnswer?.writingGuide ? (
              <div className="border-l-4 border-blue-600 bg-white rounded-lg shadow-md overflow-hidden">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-b">
                  <h3 className="font-semibold text-gray-900 uppercase text-sm">Long Answer Example ({question.marks || 0} {t('marks')})</h3>
                </div>
                <div className="p-6 space-y-6 bg-white">
                  <AnswerWritingGuidePanel guide={latestLongAnswer.writingGuide} marksLabel="20-25" />
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{t('realAnswerContent')}</p>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-gray-800 leading-relaxed text-sm whitespace-pre-wrap font-serif">
                      {normalizeAnswerText(latestLongAnswer.text || latestLongAnswer.writingGuide.modelAnswer || latestLongAnswer.answer)}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-8 text-center">
                <BookOpen className="h-16 w-16 text-blue-600 mx-auto mb-4 opacity-50" />
                <p className="text-blue-900 font-semibold text-lg">No long-question guidance available</p>
                <p className="text-blue-800 text-sm mt-2">Prepare a long answer to see its writing guidance here.</p>
              </div>
            )}
          </div>
        )}
      </div>
        )}

        {/* Long Answer Tab */}
        {activeTab === 'answer' && (
          <div className="p-8 space-y-6">
            <div className="flex flex-wrap gap-2 border-b" role="tablist" aria-label="Answer formats by marks">
              {(['5', '15', '20-25'] as AnswerMarkBand[]).map((band) => (
                <button
                  key={band}
                  type="button"
                  role="tab"
                  aria-selected={activeAnswerBand === band}
                  onClick={() => setActiveAnswerBand(band)}
                  className={`border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
                    activeAnswerBand === band
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-900'
                  }`}
                >
                  {answerBandLabel(band, locale)}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {!primaryAnswer ? t('prepareLongAnswer') : primaryAnswer.type === 'long' ? t('comprehensiveLongAnswer') : t('shortAnswer')}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {!primaryAnswer
                    ? t('generateDetailedAnswer')
                    : primaryAnswer.writingGuide
                      ? `${primaryAnswer.writingGuide.marks} ${t('marks')}`
                      : t('detailedAnswerMarks', { marks: question.marks || 0 })}
                </p>
              </div>
              {selectedBandMatchesQuestion && <button
                type="button"
                disabled={preparing}
                onClick={() => prepareAnswer(activeAnswerType)}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Wand2 className="h-4 w-4" />
                <span>{primaryAnswer ? t('regenerate') : t('prepare')} {activeAnswerType === 'long' ? t('longAnswer') : t('shortAnswer')}</span>
              </button>}
            </div>

            {preparing && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="inline-block">
                    <div className="h-8 w-8 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
                  </div>
                  <p className="mt-3 text-gray-600">{t('preparingAnswer')}</p>
                </div>
              </div>
            )}

            {!preparing && !primaryAnswer && (
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-8 text-center">
                <BookOpen className="h-16 w-16 text-blue-600 mx-auto mb-4 opacity-50" />
                <p className="text-blue-900 font-semibold text-lg">{locale === 'gu' ? `${activeAnswerBand === '20-25' ? '૨૦/૨૫' : activeAnswerBand} ગુણનો અલગ જવાબ ઉપલબ્ધ નથી` : `No separate ${activeAnswerBand} marks answer is available yet`}</p>
                <p className="text-blue-800 text-sm mt-2">{locale === 'gu' ? 'આ ગુણ-પ્રકાર માટે વાસ્તવિક, પ્રશ્ન-વિશિષ્ટ જવાબ તૈયાર થયા પછી અહીં દેખાશે.' : 'A real, question-specific answer for this mark band will appear here when prepared.'}</p>
              </div>
            )}

            {!preparing && primaryAnswer && (
              <div className="space-y-4">
                {languageFallback && locale === 'gu' && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    ગુજરાતી જવાબ ઉપલબ્ધ નથી; નીચેનો English answer આ જ પ્રશ્ન માટે દર્શાવવામાં આવ્યો છે.
                  </div>
                )}
                {displayAnswers.map((answer, index) => (
                  <div key={answer._id || index} className="border rounded-lg overflow-hidden">
                    {/* Answer Header */}
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-b flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
                          <CheckCircle2 className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 uppercase text-sm">{answer.type === 'short' ? t('shortAnswer') : t('comprehensiveLongAnswer')}</h3>
                        </div>
                      </div>
                      <div className="text-right">
                        {answer.reviewStatus === 'review_required' && (
                          <span className="mb-2 block rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">{locale === 'gu' ? 'સમીક્ષા જરૂરી' : 'Review Required'}</span>
                        )}
                        {answer.difficulty && (
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                            answer.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                            answer.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {localizedDifficulty(answer.difficulty, locale)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Answer Body */}
                    <div className="p-6 space-y-6 bg-white">
                      {/* Main Answer Text */}
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3 text-sm">{t('completeAnswer')}</h4>
                        {answer.formattedContent?.length ? <FormattedBlocks blocks={answer.formattedContent} /> : <FormattedAnswer text={normalizeAnswerText(answer.text || answer.writingGuide?.modelAnswer || answer.answer || '')} />}
                      </div>

                      <AnswerReviewPanel answer={answer} />

                      {/* Key Points */}
                      {answer.keyPoints && answer.keyPoints.length > 0 && (
                        <div className="bg-blue-50 rounded-lg p-5 border border-blue-200">
                          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm">
                            <span className="h-2 w-2 rounded-full bg-blue-600" />
                            {t('keyConcepts')}
                          </h4>
                          <ul className="space-y-2">
                            {answer.keyPoints.map((point, idx) => (
                              <li key={idx} className="flex gap-3 text-gray-700 text-sm">
                                <span className="text-blue-600 font-bold flex-shrink-0 w-5">●</span>
                                <span>{point}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Study Tips */}
                      {answer.studyTips && answer.studyTips.length > 0 && (
                        <div className="bg-amber-50 rounded-lg p-5 border border-amber-200">
                          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm">
                            <span className="h-2 w-2 rounded-full bg-amber-600" />
                            {t('studyTips')}
                          </h4>
                          <ul className="space-y-2">
                            {answer.studyTips.map((tip, idx) => (
                              <li key={idx} className="flex gap-3 text-gray-700 text-sm">
                                <span className="text-amber-600 font-bold flex-shrink-0 w-5">✓</span>
                                <span>{tip}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
