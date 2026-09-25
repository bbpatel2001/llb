import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Answer, AnswerWritingGuide, Question } from '@/types';
import { answersApi, questionsApi } from '@/lib/api';
import { ErrorMessage, LoadingSpinner } from '@/components';
import { StudyActions } from '@/components/StudyActions';
import { AdminTopicMapping } from '@/components/AdminTopicMapping';
import { getErrorMessage } from '@/lib/utils';
import { useLocale } from '@/context/LocaleContext';
import { CheckCircle2, Wand2, FileText, BookOpen, Lightbulb } from 'lucide-react';

function AnswerWritingGuidePanel({ guide, title = 'How to write this answer' }: { guide: AnswerWritingGuide; title?: string }) {
  return (
    <div className="bg-blue-50 rounded-lg p-5 border border-blue-200">
      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm">
        <span className="h-2 w-2 rounded-full bg-blue-600" />
        {title}
      </h4>
      <p className="text-sm text-blue-900 mb-3">
        {guide.marks} marks · {guide.targetPages} · {guide.targetWords}
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

export function QuestionDetailPage() {
  const { questionId } = useParams<{ questionId: string }>();
  const { locale, t } = useLocale();
  console.log('🔄 QuestionDetailPage rendered with questionId:', questionId);
  const [question, setQuestion] = useState<Question | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(true);
  const [preparing, setPreparing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'question' | 'prepare' | 'answer'>('question');

  useEffect(() => {
    if (!questionId) return;
    console.log('📝 QuestionDetailPage: Loading question', questionId);
    Promise.all([questionsApi.getById(questionId), answersApi.getByQuestion(questionId, locale)])
      .then(([questionResponse, answerResponse]) => {
        console.log('✅ Question API Response:', questionResponse);
        console.log('✅ Answers API Response:', answerResponse);
        const q = questionResponse.data?.question || questionResponse.data;
        const a = answerResponse.data?.answers || answerResponse.data?.data?.answers || [];
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

  const shortAnswer = answers.find((answer) => answer.type === 'short');
  const longAnswers = answers.filter((answer) => answer.type === 'long');
  const firstLongAnswer = longAnswers[0];
  const shortGuide = shortAnswer?.writingGuide;
  const shortInclusions = shortGuide?.include?.slice(0, 4) ?? [
    t('directAnswer'),
    t('legalTerminology'),
    t('keyProvisions'),
    t('concise'),
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Success Banner */}
      <div className="bg-green-100 p-4 rounded-lg border-2 border-green-500 mb-4">
        <p className="font-bold">✅ {t('questionLoadedSuccessfully')}</p>
        <p className="text-sm mt-1">ID: {question._id}</p>
      </div>

      {/* Question Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{t('question')} {question.questionNumber}</h1>
        <p className="text-gray-600 mt-2">{t('semester')} {question.semester} · {question.subject} · {question.marks || 0} {t('marks')} · {question.type}</p>
      </div>

      {/* Study actions */}
      <StudyActions targetType="question" targetId={question._id} />
      <AdminTopicMapping question={question} onSaved={(topicRefs) => setQuestion((current) => current ? { ...current, topicRefs } : current)} />

      {/* Tab Navigation */}
      <div className="bg-white rounded-t-lg shadow border-b flex">
        <button
          onClick={() => setActiveTab('question')}
          className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
            activeTab === 'question'
              ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <FileText className="h-5 w-5" />
          <span>{t('question')}</span>
        </button>
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
          <span>{t('longAnswer')} ({longAnswers.length})</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-b-lg shadow">
        {/* Question Tab */}
        {activeTab === 'question' && (
          <div className="p-8 space-y-6">
            {/* Question Text */}
            <article className="bg-blue-50 rounded-lg p-6 border-l-4 border-blue-600">
              <h2 className="text-2xl font-semibold text-gray-900 whitespace-pre-wrap">{question.questionText}</h2>
            </article>

            {/* MCQ Options if applicable */}
            {question.options && question.options.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900">{t('options')}:</h3>
                <div className="grid gap-3">
                  {question.options.map((option) => (
                    <div key={option.label} className="rounded-lg border border-gray-200 p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center font-semibold text-blue-600">
                          {option.label}
                        </div>
                        <div className="flex-1">
                          <p className="text-gray-900">{option.text}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Question Metadata */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
              <div className="space-y-1">
                <p className="text-sm text-gray-500">{t('marks')}</p>
                <p className="font-semibold text-gray-900">{question.marks || 0}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-500">{t('type')}</p>
                <p className="font-semibold text-gray-900 uppercase text-sm">{question.type}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-500">{t('subject')}</p>
                <p className="font-semibold text-gray-900">{question.subject}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-500">{t('semester')}</p>
                <p className="font-semibold text-gray-900">{question.semester}</p>
              </div>
            </div>
          </div>
        )}

        {/* How to Write Tab - Shows SHORT ANSWER */}
        {activeTab === 'prepare' && (
          <div className="p-8 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">📝 {t('shortAnswerExample')}</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {shortGuide
                    ? `${shortGuide.marks} ${t('marks')} · ${shortGuide.targetPages} · ${shortGuide.targetWords}`
                    : t('shortAnswerDescription')}
                </p>
              </div>
            </div>

            {answers.length > 0 && shortAnswer ? (
              <div className="space-y-4">
                {/* Answer Card */}
                <div className="border-l-4 border-amber-500 bg-white rounded-lg shadow-md overflow-hidden">
                  {/* Header */}
                  <div className="bg-gradient-to-r from-amber-50 to-yellow-50 px-6 py-4 border-b-2 border-amber-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg">✓ {t('shortAnswer')} ({shortGuide?.marks || question.marks || 0} {t('marks')})</h3>
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
                        {shortGuide?.modelAnswer || shortAnswer?.text || shortAnswer?.answer}
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

                {firstLongAnswer?.writingGuide && (
                  <div className="border-l-4 border-blue-600 bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-b">
                      <h3 className="font-semibold text-gray-900 uppercase text-sm">✓ Long Answer Example ({firstLongAnswer.writingGuide.marks} {t('marks')})</h3>
                      <p className="text-sm text-gray-600 mt-1">How to structure the complete answer and then develop the real answer logically.</p>
                    </div>
                    <div className="p-6 space-y-6 bg-white">
                      <AnswerWritingGuidePanel guide={firstLongAnswer.writingGuide} />
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{t('realAnswerContent')}</p>
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-gray-800 leading-relaxed text-sm whitespace-pre-wrap font-serif">
                          {firstLongAnswer.writingGuide.modelAnswer || firstLongAnswer.text || firstLongAnswer.answer}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

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

        {/* Long Answer Tab */}
        {activeTab === 'answer' && (
          <div className="p-8 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {longAnswers.length === 0 ? t('prepareLongAnswer') : t('comprehensiveLongAnswer')}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {longAnswers.length === 0
                    ? t('generateDetailedAnswer')
                    : longAnswers[0].writingGuide
                      ? `${longAnswers[0].writingGuide.marks} ${t('marks')} · ${longAnswers[0].writingGuide.targetPages} · ${longAnswers[0].writingGuide.targetWords}`
                      : t('detailedAnswerMarks', { marks: question.marks || 0 })}
                </p>
              </div>
              <button
                type="button"
                disabled={preparing}
                onClick={() => prepareAnswer('long')}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Wand2 className="h-4 w-4" />
                <span>{longAnswers.length > 0 ? t('regenerate') : t('prepare')} {t('longAnswer')}</span>
              </button>
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

            {!preparing && longAnswers.length === 0 && (
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-8 text-center">
                <BookOpen className="h-16 w-16 text-blue-600 mx-auto mb-4 opacity-50" />
                <p className="text-blue-900 font-semibold text-lg">{t('noLongAnswer')}</p>
                <p className="text-blue-800 text-sm mt-2">{t('generateComprehensiveAnswer')}</p>
              </div>
            )}

            {!preparing && longAnswers.length > 0 && (
              <div className="space-y-4">
                {longAnswers.map((answer, index) => (
                  <div key={answer._id || index} className="border rounded-lg overflow-hidden">
                    {/* Answer Header */}
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-b flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
                          <CheckCircle2 className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 uppercase text-sm">{t('comprehensiveLongAnswer')}</h3>
                          {answer.wordCount && (
                            <p className="text-xs text-gray-600 mt-1">~{answer.wordCount} {t('words')}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        {answer.difficulty && (
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                            answer.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                            answer.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {answer.difficulty.charAt(0).toUpperCase() + answer.difficulty.slice(1)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Answer Body */}
                    <div className="p-6 space-y-6 bg-white">
                      {answer.writingGuide && <AnswerWritingGuidePanel guide={answer.writingGuide} />}

                      {/* Main Answer Text */}
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3 text-sm">{t('completeAnswer')}</h4>
                        <div className="whitespace-pre-wrap leading-8 text-gray-700 font-sans text-base space-y-4">
                          {answer.writingGuide?.modelAnswer || answer.text || answer.answer}
                        </div>
                      </div>

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
