import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Flashcard, FlashcardOption, FlashcardSessionAnswer, FlashcardSessionSummary } from '@/types';
import { FlashcardCard } from './FlashcardCard';

interface FlashcardViewerProps {
  cards: Flashcard[];
  onReview?: (card: Flashcard, quality: number) => Promise<void> | void;
  onSessionComplete?: (summary: FlashcardSessionSummary) => Promise<void> | void;
}

interface DisplayOption {
  label: string;
  sourceLabel: string;
  text: string;
  explanation?: string;
}

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

function normalizeAnswer(value: unknown): string {
  return typeof value === 'string' ? value.trim().toLowerCase().replace(/[.)]$/, '') : '';
}

function usableOptions(card: Flashcard): FlashcardOption[] {
  return (card.options || []).filter((option) => option.label.trim() && option.text.trim());
}

function shuffledDisplayOptions(card: Flashcard): DisplayOption[] {
  const sourceOptions: DisplayOption[] = usableOptions(card).map((option) => ({
    label: option.label.trim(),
    sourceLabel: option.label.trim(),
    text: option.text.trim(),
    explanation: option.explanation,
  }));
  let seed = Array.from(card._id).reduce(
    (total, character) => ((total * 31) + character.charCodeAt(0)) >>> 0,
    7,
  );

  for (let index = sourceOptions.length - 1; index > 0; index -= 1) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const swapIndex = seed % (index + 1);
    [sourceOptions[index], sourceOptions[swapIndex]] = [sourceOptions[swapIndex], sourceOptions[index]];
  }

  return sourceOptions.map((option, index) => ({
    ...option,
    label: OPTION_LABELS[index] || String.fromCharCode(65 + index),
  }));
}

export function FlashcardViewer({ cards, onReview, onSessionComplete }: FlashcardViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [answerResults, setAnswerResults] = useState<Record<string, FlashcardSessionAnswer>>({});
  const [reviewedCards, setReviewedCards] = useState<Record<string, boolean>>({});
  const [sessionFinished, setSessionFinished] = useState(false);
  const [savingSession, setSavingSession] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const sessionStartedAt = useRef(new Date().toISOString());

  const activeIndex = cards.length > 0 ? Math.min(currentIndex, cards.length - 1) : 0;
  const currentCard = cards[activeIndex];
  const currentCardId = currentCard?._id;
  const currentOptions = useMemo(
    () => (currentCard ? shuffledDisplayOptions(currentCard) : []),
    [currentCard],
  );
  const objectiveCards = useMemo(() => cards.filter((card) => {
    const options = usableOptions(card);
    const correctAnswer = normalizeAnswer(card.correctAnswer);
    return options.length >= 2 && Boolean(correctAnswer) && options.some((option) => (
      normalizeAnswer(option.label) === correctAnswer || normalizeAnswer(option.text) === correctAnswer
    ));
  }).length, [cards]);
  const answered = Object.values(answerResults);
  const correctAnswers = answered.filter((answer) => answer.isCorrect).length;
  const percentage = answered.length > 0 ? Math.round((correctAnswers / answered.length) * 100) : 0;
  const sessionSummary: FlashcardSessionSummary = {
    totalCards: cards.length,
    objectiveCards,
    answeredCards: answered.length,
    correctAnswers,
    percentage,
    reviewedCards: Object.keys(reviewedCards).length,
    answers: answered,
  };

  useEffect(() => {
    setCurrentIndex((previousIndex) => (
      cards.length > 0 ? Math.min(previousIndex, cards.length - 1) : 0
    ));
    setAnswerResults({});
    setReviewedCards({});
    setSessionFinished(false);
    setSessionError(null);
    sessionStartedAt.current = new Date().toISOString();
  }, [cards]);

  useEffect(() => {
    setSelectedOption(currentCardId ? answerResults[currentCardId]?.selectedAnswer || null : null);
  }, [currentCardId, answerResults]);

  if (cards.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-600">No flashcards available</p>
      </div>
    );
  }

  if (sessionFinished) {
    return (
      <section className="space-y-5 rounded-lg border border-primary-200 bg-primary-50 p-6 text-center">
        <h2 className="text-2xl font-bold text-gray-900">Study session complete</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded bg-white p-4 shadow-sm"><p className="text-sm text-gray-600">MCQ score</p><p className="mt-1 text-3xl font-bold text-primary-700">{correctAnswers} / {answered.length}</p><p className="text-sm text-gray-600">{percentage}%</p></div>
          <div className="rounded bg-white p-4 shadow-sm"><p className="text-sm text-gray-600">Objective cards</p><p className="mt-1 text-3xl font-bold text-primary-700">{answered.length} / {objectiveCards}</p></div>
          <div className="rounded bg-white p-4 shadow-sm"><p className="text-sm text-gray-600">Recall ratings</p><p className="mt-1 text-3xl font-bold text-primary-700">{sessionSummary.reviewedCards} / {cards.length}</p></div>
        </div>
        {sessionError && <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">Score could not be saved: {sessionError}</p>}
        <p className="text-sm text-gray-700">The MCQ score counts only cards where you selected an answer. Recall ratings are tracked separately for spaced repetition.</p>
        <button type="button" onClick={() => { setSessionFinished(false); setCurrentIndex(0); setAnswerResults({}); setReviewedCards({}); setSessionError(null); sessionStartedAt.current = new Date().toISOString(); }} className="rounded bg-primary-600 px-5 py-2 font-semibold text-white">Start another session</button>
      </section>
    );
  }

  const correctOption = currentOptions.find((option) => {
    const correctAnswer = normalizeAnswer(currentCard.correctAnswer);
    return normalizeAnswer(option.sourceLabel) === correctAnswer || normalizeAnswer(option.text) === correctAnswer;
  });
  const canAnswer = currentOptions.length >= 2 && Boolean(correctOption);
  const selectedChoice = currentOptions.find((option) => option.sourceLabel === selectedOption);
  const selectedIsCorrect = Boolean(selectedChoice && correctOption && selectedChoice.sourceLabel === correctOption.sourceLabel);

  const handlePrevious = () => {
    setCurrentIndex((previousIndex) => Math.max(previousIndex - 1, 0));
  };

  const handleNext = () => {
    setCurrentIndex((previousIndex) => Math.min(previousIndex + 1, cards.length - 1));
  };

  const handleOptionSubmit = (option: DisplayOption) => {
    if (!canAnswer || selectedOption || answerResults[currentCard._id]) return;
    const isCorrect = Boolean(correctOption && option.sourceLabel === correctOption.sourceLabel);
    setSelectedOption(option.sourceLabel);
    setAnswerResults((previous) => ({
      ...previous,
      [currentCard._id]: { cardId: currentCard._id, selectedAnswer: option.sourceLabel, isCorrect },
    }));
  };

  const handleReview = async (quality: number) => {
    if (!onReview) return;
    try {
      await onReview(currentCard, quality);
      setReviewedCards((previous) => ({ ...previous, [currentCard._id]: true }));
      handleNext();
    } catch {
      // The parent displays the review error; do not advance on a failed save.
    }
  };

  const finishSession = async () => {
    setSavingSession(true);
    setSessionError(null);
    try {
      await onSessionComplete?.(sessionSummary);
    } catch (error) {
      setSessionError(error instanceof Error ? error.message : 'The session could not be saved.');
    } finally {
      setSavingSession(false);
      setSessionFinished(true);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-primary-200 bg-primary-50 p-4" aria-label="Study session score">
        <div className="grid gap-3 sm:grid-cols-3">
          <div><p className="text-xs font-semibold uppercase text-gray-600">MCQ score</p><p className="text-2xl font-bold text-primary-700">{correctAnswers} / {answered.length} <span className="text-base font-medium">({percentage}%)</span></p></div>
          <div><p className="text-xs font-semibold uppercase text-gray-600">Objective progress</p><p className="text-2xl font-bold text-gray-900">{answered.length} / {objectiveCards}</p></div>
          <div><p className="text-xs font-semibold uppercase text-gray-600">Recall ratings</p><p className="text-2xl font-bold text-gray-900">{sessionSummary.reviewedCards} / {cards.length}</p></div>
        </div>
        {onSessionComplete && (
          <button type="button" onClick={() => { void finishSession(); }} disabled={savingSession} className="mt-4 rounded bg-primary-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
            {savingSession ? 'Saving score…' : 'Finish session and save score'}
          </button>
        )}
      </section>

      <FlashcardCard key={currentCard._id} card={currentCard} />

      <div className="flex items-center justify-between"><button type="button" onClick={handlePrevious} disabled={activeIndex === 0} className="rounded-lg p-2 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40" aria-label="Previous card"><ChevronLeft className="h-6 w-6" /></button><div className="text-center"><p className="text-gray-600">Card {activeIndex + 1} of {cards.length}</p><div className="mt-2 h-2 w-48 rounded-full bg-gray-200"><div className="h-full rounded-full bg-primary-600 transition-all" style={{ width: `${((activeIndex + 1) / cards.length) * 100}%` }} /></div></div><button type="button" onClick={handleNext} disabled={activeIndex === cards.length - 1} className="rounded-lg p-2 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40" aria-label="Next card"><ChevronRight className="h-6 w-6" /></button></div>

      {canAnswer && (
        <section aria-labelledby="flashcard-options-title" className="rounded-lg border bg-white p-4 shadow-sm">
          <h2 id="flashcard-options-title" className="text-base font-semibold text-gray-900">Choose the best answer</h2>
          {currentCard.optionStatus === 'needs_review' && <p className="mt-1 text-xs text-amber-700">Draft study options — verify the legal rule with your course materials.</p>}
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {currentOptions.map((option) => {
              const isSelected = selectedOption === option.sourceLabel;
              const isCorrect = correctOption?.sourceLabel === option.sourceLabel;
              const optionClass = selectedOption
                ? isCorrect ? 'border-green-500 bg-green-50 text-green-900' : isSelected ? 'border-red-500 bg-red-50 text-red-900' : 'border-gray-200 bg-gray-50 text-gray-500'
                : 'border-gray-300 bg-white text-gray-800 hover:border-primary-500 hover:bg-primary-50';
              return <button key={option.sourceLabel} type="button" disabled={Boolean(selectedOption)} onClick={() => handleOptionSubmit(option)} className={`rounded-lg border-2 p-3 text-left transition ${optionClass} disabled:cursor-default`}><span className="font-semibold">{option.label}.</span>{' '}<span>{option.text}</span></button>;
            })}
          </div>
          {selectedChoice && <div role="alert" className={`mt-4 rounded-lg p-4 ${selectedIsCorrect ? 'bg-green-50 text-green-900' : 'bg-red-50 text-red-900'}`}><p className="font-semibold">{selectedIsCorrect ? 'Correct answer' : 'Not quite'}</p><p className="mt-1 text-sm">{selectedChoice.explanation || currentCard.explanation || currentCard.back}</p>{!selectedIsCorrect && correctOption && <p className="mt-2 text-sm font-medium">Correct answer: {correctOption.label}. {correctOption.text}</p>}</div>}
        </section>
      )}

      {onReview && <div className="rounded-lg border bg-gray-50 p-4"><p className="text-center text-sm font-medium text-gray-700">Rate your recall from 0 to 5</p><div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">{[0, 1, 2, 3, 4, 5].map((quality) => <button key={quality} type="button" onClick={() => { void handleReview(quality); }} aria-label={`Recall rating ${quality} out of 5`} className="rounded bg-white px-2 py-2 text-sm shadow hover:bg-primary-50">{quality}</button>)}</div></div>}

      <div className="grid grid-cols-8 gap-1 sm:grid-cols-10">{cards.map((card, index) => <button key={card._id} type="button" onClick={() => setCurrentIndex(index)} className={`min-h-8 rounded px-1 py-1 text-sm font-medium leading-5 transition ${index === activeIndex ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>{index + 1}</button>)}</div>
    </div>
  );
}
