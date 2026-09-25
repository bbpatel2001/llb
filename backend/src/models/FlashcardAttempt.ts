import mongoose, { Document, Schema } from 'mongoose';

export interface IFlashcardAttemptAnswer {
  flashcardId: mongoose.Types.ObjectId;
  selectedAnswer: string;
  isCorrect: boolean;
}

export interface IFlashcardAttempt extends Document {
  userId: mongoose.Types.ObjectId;
  deckId: mongoose.Types.ObjectId;
  answers: IFlashcardAttemptAnswer[];
  totalCards: number;
  objectiveCards: number;
  answeredCards: number;
  correctAnswers: number;
  percentage: number;
  reviewedCards: number;
  startedAt: Date;
  completedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const FlashcardAttemptSchema = new Schema<IFlashcardAttempt>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    deckId: { type: Schema.Types.ObjectId, ref: 'FlashcardDeck', required: true, index: true },
    answers: [
      {
        flashcardId: { type: Schema.Types.ObjectId, ref: 'Flashcard', required: true },
        selectedAnswer: { type: String, required: true, trim: true },
        isCorrect: { type: Boolean, required: true },
        _id: false,
      },
    ],
    totalCards: { type: Number, required: true, min: 0 },
    objectiveCards: { type: Number, required: true, min: 0 },
    answeredCards: { type: Number, required: true, min: 0 },
    correctAnswers: { type: Number, required: true, min: 0 },
    percentage: { type: Number, required: true, min: 0, max: 100 },
    reviewedCards: { type: Number, required: true, min: 0 },
    startedAt: { type: Date, required: true },
    completedAt: { type: Date, required: true, default: () => new Date() },
  },
  { timestamps: true }
);

FlashcardAttemptSchema.index({ userId: 1, completedAt: -1 });
FlashcardAttemptSchema.index({ userId: 1, deckId: 1, completedAt: -1 });

export const FlashcardAttempt = mongoose.model<IFlashcardAttempt>('FlashcardAttempt', FlashcardAttemptSchema);
