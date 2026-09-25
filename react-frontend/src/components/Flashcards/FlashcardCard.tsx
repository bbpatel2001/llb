import { useState } from 'react';
import { RotateCw } from 'lucide-react';
import { Flashcard } from '@/types';

interface FlashcardCardProps {
  card: Flashcard;
}

export function FlashcardCard({ card }: FlashcardCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const difficultyColors: Record<string, string> = {
    easy: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    hard: 'bg-red-100 text-red-800',
  };

  return (
    <div
      onClick={() => setIsFlipped(!isFlipped)}
      className="perspective cursor-pointer h-40"
    >
      <div
        className={`relative w-full h-full transition-transform duration-500 transform ${
          isFlipped ? 'rotate-y-180' : ''
        }`}
        style={{
          transformStyle: 'preserve-3d',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        {/* Front */}
        <div
          className={`absolute w-full h-full bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg shadow-lg p-4 flex flex-col gap-2 text-white ${
            isFlipped ? 'hidden' : ''
          }`}
          style={{ backfaceVisibility: 'hidden' }}
        >
          <div>
            <span className={`inline-block px-2 py-1 rounded text-xs font-semibold bg-white ${difficultyColors[card.difficulty] || 'bg-gray-100'}`}>
              {card.difficulty}
            </span>
          </div>
          <div className="min-h-0">
            <p className="text-sm opacity-75">Question</p>
            <p className="text-xl font-semibold mt-2 max-h-28 overflow-y-auto pr-1">{card.front}</p>
          </div>
          <div className="flex items-center justify-center gap-2 text-sm opacity-75">
            <RotateCw className="w-4 h-4" />
            <span>Click to reveal</span>
          </div>
        </div>

        {/* Back */}
        <div
          className={`absolute w-full h-full bg-gradient-to-br from-green-500 to-green-700 rounded-lg shadow-lg p-4 flex flex-col gap-2 text-white ${
            !isFlipped ? 'hidden' : ''
          }`}
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <div>
            <span className="inline-block px-2 py-1 rounded text-xs font-semibold bg-white text-gray-900">
              {card.topicId || card.category}
            </span>
          </div>
          <div className="min-h-0">
            <p className="text-sm opacity-75">Answer</p>
            <p className="text-lg font-semibold mt-2 max-h-32 overflow-y-auto pr-1 whitespace-pre-line">{card.back}</p>
          </div>
          <div className="flex items-center justify-center gap-2 text-sm opacity-75">
            <RotateCw className="w-4 h-4" />
            <span>Click to flip back</span>
          </div>
        </div>
      </div>
    </div>
  );
}
