import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { studyApi } from '@/lib/api';
import { FlashcardAttempt } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { ErrorMessage, LoadingSpinner } from '@/components';
import { getErrorMessage } from '@/lib/utils';

function deckName(deck: FlashcardAttempt['deckId']): string {
  return typeof deck === 'object' ? deck.name : 'Flashcard deck';
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString();
}

export function FlashcardHistoryPage() {
  const { user } = useAuth();
  const [attempts, setAttempts] = useState<FlashcardAttempt[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAttempts = useCallback(async (append = false) => {
    if (!user) return;
    try {
      setError(null);
      if (append) setLoadingMore(true);
      else setLoading(true);
      const response = await studyApi.getFlashcardAttempts(append ? attempts.length : 0, 20);
      setAttempts((current) => append ? [...current, ...(response.data.attempts || [])] : (response.data.attempts || []));
      setTotal(response.data.total || 0);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [attempts.length, user]);

  useEffect(() => { void loadAttempts(); }, [loadAttempts]);

  if (!user) {
    return <div className="rounded-lg bg-white p-8 text-center shadow"><h1 className="text-2xl font-bold text-gray-900">Sign in to view flashcard scores</h1><Link className="mt-4 inline-block text-primary-700" to="/login">Sign in</Link></div>;
  }
  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><h1 className="text-3xl font-bold text-gray-900">Flashcard Session History</h1><p className="mt-2 text-gray-600">Objective MCQ scores and recall-session records.</p></div>
        <Link to="/flashcards" className="rounded bg-primary-600 px-4 py-2 font-semibold text-white">Study flashcards</Link>
      </div>
      {error && <ErrorMessage message={error} onRetry={() => void loadAttempts()} />}
      {attempts.length === 0 ? <div className="rounded-lg bg-white p-8 text-center text-gray-600 shadow">No completed flashcard sessions yet.</div> : (
        <>
          <div className="overflow-x-auto rounded-lg bg-white shadow"><table className="min-w-full text-left text-sm"><thead className="border-b bg-gray-50 text-gray-600"><tr><th className="px-4 py-3">Deck</th><th className="px-4 py-3">MCQ score</th><th className="px-4 py-3">Percentage</th><th className="px-4 py-3">Recall ratings</th><th className="px-4 py-3">Completed</th></tr></thead><tbody className="divide-y">{attempts.map((attempt) => <tr key={attempt._id} className="hover:bg-gray-50"><td className="px-4 py-3 font-medium text-gray-900">{deckName(attempt.deckId)}</td><td className="px-4 py-3">{attempt.correctAnswers} / {attempt.answeredCards}</td><td className="px-4 py-3 font-semibold text-primary-700">{Number(attempt.percentage).toFixed(2)}%</td><td className="px-4 py-3">{attempt.reviewedCards} / {attempt.totalCards}</td><td className="px-4 py-3 text-gray-600">{formatDate(attempt.completedAt)}</td></tr>)}</tbody></table></div>
          {attempts.length < total && <div className="text-center"><button type="button" onClick={() => void loadAttempts(true)} disabled={loadingMore} className="rounded border border-primary-700 px-4 py-2 font-medium text-primary-700 disabled:opacity-50">{loadingMore ? 'Loading…' : `Load more sessions (${attempts.length} of ${total})`}</button></div>}
        </>
      )}
    </div>
  );
}
