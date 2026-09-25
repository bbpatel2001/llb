import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlashcardViewer, LoadingSpinner, ErrorMessage } from '@/components';
import { flashcardsApi, studyApi } from '@/lib/api';
import { Flashcard, FlashcardDeck, FlashcardSessionSummary } from '@/types';
import { getErrorMessage } from '@/lib/utils';

export function FlashcardsPage() {
  const [decks, setDecks] = useState<FlashcardDeck[]>([]);
  const [semesterFilter, setSemesterFilter] = useState<string>('1');
  const [subjectFilter, setSubjectFilter] = useState<string>('');
  const [selectedDeck, setSelectedDeck] = useState<string>('');
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [availableCounts, setAvailableCounts] = useState<Record<string, number>>({});
  const [deckRefreshToken, setDeckRefreshToken] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [sessionStartedAt, setSessionStartedAt] = useState<string>(() => new Date().toISOString());

  const loadDecks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await flashcardsApi.getDecks({ limit: 100 });
      const availableDecks = response.data.decks || [];
      setDecks(availableDecks);
      setDeckRefreshToken((token) => token + 1);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadDecks(); }, [loadDecks]);

  const semesterOptions = useMemo(
    () => Array.from(new Set(decks.map((deck) => deck.semester))).sort((a, b) => a - b),
    [decks]
  );
  const subjectOptions = useMemo(
    () => Array.from(new Set(decks.map((deck) => deck.subject))).sort(),
    [decks]
  );
  const filteredDecks = useMemo(
    () => decks.filter((deck) => (
      (!semesterFilter || String(deck.semester) === semesterFilter)
      && (!subjectFilter || deck.subject === subjectFilter)
    )),
    [decks, semesterFilter, subjectFilter]
  );

  useEffect(() => {
    setSelectedDeck((current) => (
      filteredDecks.some((deck) => deck._id === current)
        ? current
        : filteredDecks[0]?._id || ''
    ));
  }, [filteredDecks]);

  useEffect(() => {
    if (!selectedDeck || !filteredDecks.some((deck) => deck._id === selectedDeck)) {
      setCards([]);
      return;
    }

    setCards([]);
    setLoading(true);
    setError(null);
    flashcardsApi.getDeck(selectedDeck)
      .then((response) => {
        setCards(response.data.flashcards || []);
        if (typeof response.data.availableCount === 'number') {
          setAvailableCounts((current) => ({ ...current, [selectedDeck]: response.data.availableCount }));
        }
        setSessionStartedAt(new Date().toISOString());
      })
      .catch((requestError) => {
        setError(getErrorMessage(requestError));
      })
      .finally(() => setLoading(false));
  }, [selectedDeck, filteredDecks, deckRefreshToken]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Flashcards</h1>
          <p className="mt-2 text-gray-600">
            Study {filteredDecks.reduce((total, deck) => total + (availableCounts[deck._id] ?? deck.cardCount), 0)} unique cards in {filteredDecks.length} matching deck{filteredDecks.length === 1 ? '' : 's'}.
          </p>
        </div>
        <button type="button" onClick={() => void loadDecks()} className="rounded border border-primary-700 px-3 py-2 text-sm font-medium text-primary-700 hover:bg-primary-50">Refresh decks</button>
      </div>

      {decks.length > 0 && (
        <div className="grid gap-4 rounded-lg border bg-gray-50 p-4 md:grid-cols-3">
          <label className="text-sm font-medium text-gray-700">
            Semester
            <select
              value={semesterFilter}
              onChange={(event) => setSemesterFilter(event.target.value)}
              className="mt-1 w-full rounded border bg-white px-3 py-2"
            >
              <option value="">All semesters</option>
              {semesterOptions.map((semester) => (
                <option key={semester} value={semester}>Semester {semester}</option>
              ))}
            </select>
          </label>

          <label className="text-sm font-medium text-gray-700">
            Subject
            <select
              value={subjectFilter}
              onChange={(event) => setSubjectFilter(event.target.value)}
              className="mt-1 w-full rounded border bg-white px-3 py-2"
            >
              <option value="">All subjects</option>
              {subjectOptions.map((subject) => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
          </label>

          <label className="text-sm font-medium text-gray-700">
            Deck
            <select
              value={selectedDeck}
              onChange={(event) => setSelectedDeck(event.target.value)}
              className="mt-1 w-full rounded border bg-white px-3 py-2"
              disabled={filteredDecks.length === 0}
            >
              {filteredDecks.length === 0 && <option value="">No matching decks</option>}
              {filteredDecks.map((deck) => {
                const cardCount = availableCounts[deck._id] ?? deck.cardCount;
                return <option key={deck._id} value={deck._id}>{deck.name} ({cardCount} unique cards)</option>;
              })}
            </select>
          </label>
        </div>
      )}

      {decks.length > 0 && filteredDecks.length === 0 && (
        <p className="rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          No flashcard deck matches the selected semester and subject.
        </p>
      )}

      {error && <ErrorMessage message={error} />}
      {reviewError && <ErrorMessage message={reviewError} />}
      {loading ? <LoadingSpinner /> : (
        <div className="rounded-lg bg-white p-8 shadow">
          <FlashcardViewer
            cards={cards}
            onSessionComplete={async (summary: FlashcardSessionSummary) => {
              await studyApi.saveFlashcardAttempt(selectedDeck, {
                answers: summary.answers.map(({ cardId, selectedAnswer }) => ({ cardId, selectedAnswer })),
                reviewedCards: summary.reviewedCards,
                startedAt: sessionStartedAt,
              });
            }}
            onReview={async (card, quality) => {
            try {
              setReviewError(null);
              await studyApi.reviewFlashcard(card._id, quality);
            } catch (requestError) {
              setReviewError(getErrorMessage(requestError));
              throw requestError;
            }
          }} />
        </div>
      )}
    </div>
  );
}
