'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface Flashcard {
  _id: string;
  front: string;
  back: string;
  category: 'definition' | 'section' | 'case' | 'principle' | 'concept' | 'act' | 'timeline';
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  relatedCases: string[];
  examples: string[];
  mnemonics?: string;
}

interface FlashcardViewerProps {
  deckId: string;
  deckName?: string;
}

export default function FlashcardViewer({ deckId, deckName = 'Flashcard Deck' }: FlashcardViewerProps) {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [studyMode, setStudyMode] = useState<'browse' | 'learn'>('browse');

  useEffect(() => {
    fetchFlashcards();
  }, [deckId]);

  const fetchFlashcards = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/content/flashcards/deck/${deckId}`);
      const data = await response.json();
      
      if (data.success) {
        setFlashcards(data.flashcards);
        setCurrentIndex(0);
        setIsFlipped(false);
      } else {
        setError(data.error || 'Failed to fetch flashcards');
      }
    } catch (err) {
      setError('Error fetching flashcards');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrevious = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev === 0 ? flashcards.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev === flashcards.length - 1 ? 0 : prev + 1));
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'hard':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      definition: 'bg-blue-100 text-blue-800',
      section: 'bg-purple-100 text-purple-800',
      case: 'bg-amber-100 text-amber-800',
      principle: 'bg-indigo-100 text-indigo-800',
      concept: 'bg-cyan-100 text-cyan-800',
      act: 'bg-orange-100 text-orange-800',
      timeline: 'bg-pink-100 text-pink-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="text-2xl mb-2">📚</div>
          <p>Loading flashcards...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
        {error}
      </div>
    );
  }

  if (flashcards.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <p className="text-gray-600">No flashcards available in this deck</p>
      </div>
    );
  }

  const currentCard = flashcards[currentIndex];
  const progress = ((currentIndex + 1) / flashcards.length) * 100;

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">{deckName}</h2>
          <p className="text-gray-600 text-sm">
            Card {currentIndex + 1} of {flashcards.length}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={studyMode === 'browse' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStudyMode('browse')}
          >
            Browse
          </Button>
          <Button
            variant={studyMode === 'learn' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStudyMode('learn')}
          >
            Learn
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all"
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      {/* Flashcard */}
      <Card
        className="cursor-pointer transition-all h-80 flex flex-col justify-center items-center bg-gradient-to-br"
        onClick={handleFlip}
        style={{
          backgroundImage: isFlipped
            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        }}
      >
        <CardContent className="text-white text-center space-y-4 w-full h-full flex flex-col justify-center items-center p-8">
          <div className="text-sm font-semibold opacity-75">
            {isFlipped ? 'Answer' : 'Question'}
          </div>
          <div className="text-2xl font-bold">
            {isFlipped ? currentCard.back : currentCard.front}
          </div>
          <div className="text-sm opacity-75 mt-4">Click to flip</div>
        </CardContent>
      </Card>

      {/* Card Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold flex items-center justify-between gap-2">
            <span>Card Information</span>
            <div className="flex gap-2">
              <Badge className={getCategoryColor(currentCard.category)}>
                {currentCard.category}
              </Badge>
              <Badge className={getDifficultyColor(currentCard.difficulty)}>
                {currentCard.difficulty}
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {currentCard.tags && currentCard.tags.length > 0 && (
            <div>
              <strong className="text-gray-700">Tags:</strong>
              <div className="flex flex-wrap gap-1 mt-1">
                {currentCard.tags.map((tag, idx) => (
                  <Badge key={idx} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {currentCard.mnemonics && (
            <div>
              <strong className="text-gray-700">Mnemonic:</strong>
              <p className="text-gray-600 mt-1 italic">{currentCard.mnemonics}</p>
            </div>
          )}

          {currentCard.relatedCases && currentCard.relatedCases.length > 0 && (
            <div>
              <strong className="text-gray-700">Related Cases:</strong>
              <ul className="list-disc list-inside text-gray-600 mt-1 space-y-1">
                {currentCard.relatedCases.map((caseRef, idx) => (
                  <li key={idx}>{caseRef}</li>
                ))}
              </ul>
            </div>
          )}

          {currentCard.examples && currentCard.examples.length > 0 && (
            <div>
              <strong className="text-gray-700">Examples:</strong>
              <ul className="list-disc list-inside text-gray-600 mt-1 space-y-1">
                {currentCard.examples.map((example, idx) => (
                  <li key={idx}>{example}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation Controls */}
      <div className="flex justify-between items-center gap-4">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={flashcards.length <= 1}
        >
          ← Previous
        </Button>

        <Button
          onClick={handleFlip}
          className="flex-1"
        >
          {isFlipped ? 'Show Question' : 'Show Answer'}
        </Button>

        <Button
          variant="outline"
          onClick={handleNext}
          disabled={flashcards.length <= 1}
        >
          Next →
        </Button>
      </div>

      {/* Study Mode Info */}
      {studyMode === 'learn' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
          <strong>Learn Mode Active:</strong> Review each card thoroughly. Click 'Mark as Learned'
          when ready to move to the next card in your spaced repetition schedule.
        </div>
      )}

      {/* Card Grid View */}
      <div className="mt-6">
        <h3 className="font-semibold mb-3">All Cards</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {flashcards.map((card, idx) => (
            <button
              key={idx}
              onClick={() => {
                setCurrentIndex(idx);
                setIsFlipped(false);
              }}
              className={`p-2 text-xs rounded-lg border-2 transition-all ${
                idx === currentIndex
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-semibold text-xs mb-1">#{idx + 1}</div>
              <div className="text-gray-600 line-clamp-2 text-xs">{card.front}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
