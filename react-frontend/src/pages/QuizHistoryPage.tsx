import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { quizzesApi } from '@/lib/api';
import { QuizAttemptSummary } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { ErrorMessage, LoadingSpinner } from '@/components';
import { getErrorMessage } from '@/lib/utils';

interface QuizResult {
  attemptId: string;
  quiz: QuizAttemptSummary['quiz'];
  totalScore: number;
  totalMarks: number;
  percentage: number;
  status: string;
  startedAt: string;
  submittedAt?: string;
  feedback?: string;
  answers: Array<{
    questionId: string;
    questionText?: string;
    selectedAnswer: string;
    correctAnswer?: string;
    isCorrect: boolean;
    marksObtained: number;
    totalMarks?: number;
  }>;
}

function formatDate(value?: string): string {
  if (!value) return 'In progress';
  return new Date(value).toLocaleString();
}

export function QuizHistoryPage() {
  const { user } = useAuth();
  const [attempts, setAttempts] = useState<QuizAttemptSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [selectedResult, setSelectedResult] = useState<QuizResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingResult, setLoadingResult] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAttempts = useCallback(async (append = false) => {
    if (!user) return;
    try {
      setError(null);
      if (append) setLoadingMore(true);
      else setLoading(true);
      const response = await quizzesApi.getHistory(append ? attempts.length : 0, 20);
      const nextAttempts = response.data.attempts || [];
      setAttempts((current) => append ? [...current, ...nextAttempts] : nextAttempts);
      setTotal(response.data.total || 0);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [attempts.length, user]);

  useEffect(() => { void loadAttempts(); }, [loadAttempts]);

  const viewResult = async (attemptId: string) => {
    try {
      setLoadingResult(true);
      setError(null);
      const response = await quizzesApi.getResults(attemptId);
      setSelectedResult(response.data.results);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoadingResult(false);
    }
  };

  if (!user) {
    return (
      <div className="rounded-lg bg-white p-8 text-center shadow">
        <h1 className="text-2xl font-bold text-gray-900">Sign in to view quiz history</h1>
        <Link className="mt-4 inline-block text-primary-700" to="/login">Sign in</Link>
      </div>
    );
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quiz History</h1>
          <p className="mt-2 text-gray-600">Your scores and saved quiz attempts.</p>
        </div>
        <Link to="/quizzes" className="rounded bg-primary-600 px-4 py-2 font-semibold text-white">Take a quiz</Link>
      </div>

      {error && <ErrorMessage message={error} onRetry={() => void loadAttempts()} />}

      {attempts.length === 0 ? (
        <div className="rounded-lg bg-white p-8 text-center text-gray-600 shadow">
          No quiz attempts yet. Start a practice test to record your first score.
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg bg-white shadow">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-3 font-semibold">Quiz</th>
                  <th className="px-4 py-3 font-semibold">Score</th>
                  <th className="px-4 py-3 font-semibold">Percentage</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Submitted</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {attempts.map((attempt) => (
                  <tr key={attempt.attemptId} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{attempt.quiz?.title || 'Quiz'}</td>
                    <td className="px-4 py-3">{attempt.status === 'submitted' ? `${attempt.totalScore} / ${attempt.totalMarks}` : '—'}</td>
                    <td className="px-4 py-3 font-semibold text-primary-700">{attempt.status === 'submitted' ? `${Number(attempt.percentage).toFixed(2)}%` : '—'}</td>
                    <td className="px-4 py-3 capitalize">{attempt.status.replace('_', ' ')}</td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(attempt.submittedAt)}</td>
                    <td className="px-4 py-3 text-right">
                      {attempt.status === 'submitted' && (
                        <button type="button" onClick={() => void viewResult(attempt.attemptId)} className="font-medium text-primary-700 hover:underline">
                          View result
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {attempts.length < total && (
            <div className="text-center">
              <button type="button" onClick={() => void loadAttempts(true)} disabled={loadingMore} className="rounded border border-primary-700 px-4 py-2 font-medium text-primary-700 disabled:opacity-50">
                {loadingMore ? 'Loading…' : `Load more attempts (${attempts.length} of ${total})`}
              </button>
            </div>
          )}
        </>
      )}

      {loadingResult && <LoadingSpinner />}
      {selectedResult && (
        <section className="rounded-lg bg-white p-6 shadow">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{selectedResult.quiz?.title || 'Quiz result'}</h2>
              <p className="mt-1 text-sm text-gray-600">Started {formatDate(selectedResult.startedAt)} · Submitted {formatDate(selectedResult.submittedAt)}</p>
            </div>
            <button type="button" onClick={() => setSelectedResult(null)} className="text-sm text-gray-600 hover:text-gray-900">Close</button>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <div className="rounded bg-primary-50 p-4"><p className="text-sm text-gray-600">Final score</p><p className="mt-1 text-2xl font-bold text-primary-700">{selectedResult.totalScore} / {selectedResult.totalMarks}</p></div>
            <div className="rounded bg-primary-50 p-4"><p className="text-sm text-gray-600">Percentage</p><p className="mt-1 text-2xl font-bold text-primary-700">{Number(selectedResult.percentage).toFixed(2)}%</p></div>
            <div className="rounded bg-primary-50 p-4"><p className="text-sm text-gray-600">Questions answered</p><p className="mt-1 text-2xl font-bold text-primary-700">{selectedResult.answers.length}</p></div>
          </div>
          {selectedResult.feedback && <p className="mt-4 rounded bg-gray-50 p-4 text-gray-700">{selectedResult.feedback}</p>}
          <div className="mt-5 space-y-3">
            {selectedResult.answers.map((answer, index) => (
              <div key={`${answer.questionId}-${index}`} className={`rounded border p-4 ${answer.isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                <p className="font-medium text-gray-900">{index + 1}. {answer.questionText || 'Question'}</p>
                <p className="mt-2 text-sm">Your answer: <strong>{answer.selectedAnswer}</strong> · {answer.isCorrect ? 'Correct' : `Correct answer: ${answer.correctAnswer || 'not available'}`}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
