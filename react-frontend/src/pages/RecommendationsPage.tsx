import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Target, TrendingUp } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { recommendationsApi } from '@/lib/api';
import { StudyRecommendation } from '@/types';
import { ErrorMessage, LoadingSpinner } from '@/components';
import { getErrorMessage } from '@/lib/utils';

interface RecommendationResponse {
  syllabus: { _id: string; subject: string; subjectCode: string; version: number };
  recommendations: StudyRecommendation[];
}

export function RecommendationsPage() {
  const { user } = useAuth();
  const [data, setData] = useState<RecommendationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    recommendationsApi.get()
      .then((response) => setData(response.data))
      .catch((requestError) => setError(getErrorMessage(requestError)))
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) return <div className="rounded-lg bg-white p-8 text-center shadow"><h1 className="text-2xl font-bold">Sign in to see recommendations</h1><Link to="/login" className="mt-4 inline-block text-primary-700">Sign in</Link></div>;
  if (loading) return <LoadingSpinner />;

  return <div className="space-y-6"><div><h1 className="text-3xl font-bold text-gray-900">Study Recommendations</h1><p className="mt-2 text-gray-600">Topics ranked by mapped-question coverage from your study history.</p></div>{error && <ErrorMessage message={error} />}{data && <><div className="rounded-lg bg-primary-50 p-5"><p className="text-sm text-primary-700">Based on</p><h2 className="mt-1 text-xl font-semibold text-primary-900">{data.syllabus.subject} · {data.syllabus.subjectCode} · Version {data.syllabus.version}</h2></div><div className="space-y-4">{data.recommendations.map((recommendation) => <article key={recommendation.topicKey} className="rounded-lg bg-white p-5 shadow"><div className="flex flex-wrap items-start justify-between gap-4"><div className="flex gap-3"><Target className={`mt-1 h-5 w-5 ${recommendation.recommended ? 'text-amber-600' : 'text-green-600'}`} /><div><h3 className="font-semibold text-gray-900">{recommendation.name}</h3><p className="mt-1 text-sm text-gray-600">{recommendation.reason}</p></div></div><Link to={`/syllabi/${data.syllabus._id}`} className="text-sm text-primary-700 hover:underline">Open syllabus</Link></div><div className="mt-4 flex items-center gap-3"><div className="h-2 flex-1 rounded-full bg-gray-200"><div className={`h-2 rounded-full ${recommendation.recommended ? 'bg-amber-500' : 'bg-green-500'}`} style={{ width: `${recommendation.coverage}%` }} /></div><span className="w-16 text-right text-sm font-medium text-gray-700">{recommendation.coverage}%</span></div><p className="mt-2 flex items-center gap-1 text-xs text-gray-500"><TrendingUp className="h-3.5 w-3.5" />{recommendation.viewedQuestionCount} of {recommendation.questionCount} mapped questions viewed</p></article>)}</div></>}{!error && !data && <p className="rounded-lg bg-white p-6 text-gray-500 shadow">No published syllabus recommendations are available.</p>}</div>;
}
