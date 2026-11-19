import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { LoadingSpinner, ErrorMessage, QuestionList } from '@/components';
import { papersApi, questionsApi } from '@/lib/api';
import { Paper, Question } from '@/types';
import { getErrorMessage } from '@/lib/utils';
import { BookOpen } from 'lucide-react';
import { useLocale } from '@/context/LocaleContext';

export function StudyPage() {
  const { paperId } = useParams<{ paperId?: string }>();
  const { t } = useLocale();
  const validPaperId = typeof paperId === 'string' && /^[0-9a-fA-F]{24}$/.test(paperId);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [paper, setPaper] = useState<Paper | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!validPaperId || !paperId) { setLoading(false); setQuestions([]); return; }
    const fetchQuestions = async () => {
      try {
        setLoading(true); setError(null);
        const [paperResponse, questionsResponse] = await Promise.all([papersApi.getById(paperId), questionsApi.getByPaper(paperId)]);
        setPaper(paperResponse.data.paper || paperResponse.data);
        setQuestions(questionsResponse.data.questions || []);
      } catch (err) { setError(getErrorMessage(err)); }
      finally { setLoading(false); }
    };
    fetchQuestions();
  }, [paperId, validPaperId]);

  if (!validPaperId) return <div className="text-center py-12"><BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" /><p className="text-gray-600">Select a paper to start studying</p><p className="text-sm text-gray-500 mt-2">Use Question Bank for cross-paper filters.</p></div>;
  return <div className="space-y-6">{loading ? <LoadingSpinner /> : error ? <ErrorMessage message={error} /> : <><div><Link to="/papers" className="text-sm font-medium text-primary-700 hover:underline">← {t('questionPapers')}</Link><h1 className="mt-3 text-3xl font-bold text-gray-900">{paper?.title || t('studyQuestions')}</h1><p className="text-gray-600 mt-2">{t('questionsFromPaper')}</p><div className="mt-4 flex flex-wrap gap-2 text-sm">{paper && <><Link to={`/papers?semester=${paper.semester}`} className="rounded-full bg-gray-100 px-3 py-1 text-gray-700 hover:bg-primary-50 hover:text-primary-700">{t('semester')} {paper.semester}</Link><Link to={`/papers?university=${encodeURIComponent(paper.university)}`} className="rounded-full bg-gray-100 px-3 py-1 text-gray-700 hover:bg-primary-50 hover:text-primary-700">{paper.university}</Link><Link to={`/papers?year=${paper.year}`} className="rounded-full bg-gray-100 px-3 py-1 text-gray-700 hover:bg-primary-50 hover:text-primary-700">{paper.examMonth ? `${paper.examMonth} ` : ''}{paper.year}</Link>{paper.subject && <Link to={`/papers?subject=${encodeURIComponent(paper.subject)}`} className="rounded-full bg-primary-50 px-3 py-1 text-primary-700 hover:bg-primary-100">{paper.subject}</Link>}</>}</div></div><p className="text-gray-600">{t('foundQuestions', { count: questions.length })}</p><QuestionList questions={questions} /></>}</div>;
}
