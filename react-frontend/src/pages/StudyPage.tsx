import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { LoadingSpinner, ErrorMessage, QuestionList } from '@/components';
import { questionsApi } from '@/lib/api';
import { Question } from '@/types';
import { getErrorMessage } from '@/lib/utils';
import { BookOpen } from 'lucide-react';

export function StudyPage() {
  const { paperId } = useParams<{ paperId?: string }>();
  const validPaperId = typeof paperId === 'string' && /^[0-9a-fA-F]{24}$/.test(paperId);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!validPaperId || !paperId) { setLoading(false); setQuestions([]); return; }
    const fetchQuestions = async () => {
      try {
        setLoading(true); setError(null);
        const response = await questionsApi.getByPaper(paperId);
        setQuestions(response.data.questions || []);
      } catch (err) { setError(getErrorMessage(err)); }
      finally { setLoading(false); }
    };
    fetchQuestions();
  }, [paperId, validPaperId]);

  if (!validPaperId) return <div className="text-center py-12"><BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" /><p className="text-gray-600">Select a paper to start studying</p><p className="text-sm text-gray-500 mt-2">Use Question Bank for cross-paper filters.</p></div>;
  return <div className="space-y-6"><div><h1 className="text-3xl font-bold text-gray-900">Study Questions</h1><p className="text-gray-600 mt-2">Questions extracted from this paper</p></div>{loading ? <LoadingSpinner /> : error ? <ErrorMessage message={error} /> : <><p className="text-gray-600">Found {questions.length} question(s)</p><QuestionList questions={questions} /></>}</div>;
}
