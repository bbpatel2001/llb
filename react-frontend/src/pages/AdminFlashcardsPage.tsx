import { useEffect, useMemo, useState } from 'react';
import { ErrorMessage, LoadingSpinner } from '@/components';
import { useAuth } from '@/context/AuthContext';
import { adminApi, flashcardsApi } from '@/lib/api';
import { Flashcard, FlashcardDeck } from '@/types';
import { getErrorMessage } from '@/lib/utils';

interface AdminDeckResponse {
  deck: FlashcardDeck;
  flashcards: Flashcard[];
  count: number;
  availableCount: number;
  skippedUnreadableCount: number;
}

export function AdminFlashcardsPage() {
  const { user } = useAuth();
  const [decks, setDecks] = useState<FlashcardDeck[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState('');
  const [deckData, setDeckData] = useState<AdminDeckResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDeck, setLoadingDeck] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedDeck = useMemo(
    () => decks.find((deck) => deck._id === selectedDeckId),
    [decks, selectedDeckId]
  );

  useEffect(() => {
    if (user?.role !== 'admin') {
      setLoading(false);
      return;
    }

    flashcardsApi.getDecks({ limit: 200 })
      .then((response) => {
        const availableDecks = response.data.decks || [];
        setDecks(availableDecks);
        setSelectedDeckId((current) => current || availableDecks[0]?._id || '');
      })
      .catch((requestError) => setError(getErrorMessage(requestError)))
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    if (!selectedDeckId || user?.role !== 'admin') {
      setDeckData(null);
      return;
    }

    setLoadingDeck(true);
    setError(null);
    adminApi.getFlashcardDeck(selectedDeckId)
      .then((response) => setDeckData(response.data))
      .catch((requestError) => {
        setDeckData(null);
        setError(getErrorMessage(requestError));
      })
      .finally(() => setLoadingDeck(false));
  }, [selectedDeckId, user]);

  if (!user || user.role !== 'admin') {
    return <div className="rounded-lg bg-white p-8 text-center shadow"><h1 className="text-2xl font-bold">Administrator access required</h1></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Flashcard Diagnostics</h1>
        <p className="mt-2 text-gray-600">Review stored flashcards that were excluded from the student study experience because their text failed readability checks.</p>
      </div>

      {error && <ErrorMessage message={error} />}
      {loading ? <LoadingSpinner /> : (
        <>
          <section className="rounded-lg bg-white p-4 shadow">
            <label className="block text-sm font-medium text-gray-700">
              Deck
              <select
                value={selectedDeckId}
                onChange={(event) => setSelectedDeckId(event.target.value)}
                className="mt-1 w-full rounded border bg-white px-3 py-2"
                disabled={decks.length === 0}
              >
                {decks.length === 0 && <option value="">No flashcard decks found</option>}
                {decks.map((deck) => (
                  <option key={deck._id} value={deck._id}>{deck.name} · Semester {deck.semester} · {deck.subject}</option>
                ))}
              </select>
            </label>
          </section>

          {loadingDeck ? <LoadingSpinner /> : deckData && (
            <section className="rounded-lg bg-white p-6 shadow">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold">{selectedDeck?.name || deckData.deck.name}</h2>
                  <p className="mt-1 text-sm text-gray-500">{deckData.deck.subject} · Semester {deckData.deck.semester}</p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-center sm:grid-cols-3">
                  <div className="rounded bg-gray-50 px-4 py-3"><p className="text-2xl font-bold">{deckData.availableCount}</p><p className="text-xs text-gray-500">Readable</p></div>
                  <div className="rounded bg-gray-50 px-4 py-3"><p className="text-2xl font-bold">{deckData.count}</p><p className="text-xs text-gray-500">Returned</p></div>
                  <div className="rounded bg-amber-50 px-4 py-3"><p className="text-2xl font-bold text-amber-800">{deckData.skippedUnreadableCount}</p><p className="text-xs text-amber-700">Unreadable</p></div>
                </div>
              </div>

              {deckData.skippedUnreadableCount > 0 ? (
                <div className="mt-6 rounded border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  <p className="font-semibold">{deckData.skippedUnreadableCount} stored card{deckData.skippedUnreadableCount === 1 ? '' : 's'} were hidden from students because the text was unreadable or corrupted.</p>
                  <p className="mt-1">Repair the source questions, regenerate this deck, and then recheck the diagnostics.</p>
                </div>
              ) : (
                <p className="mt-6 rounded border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">No unreadable stored cards were detected in this deck.</p>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}
