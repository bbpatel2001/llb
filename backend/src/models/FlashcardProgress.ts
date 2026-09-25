import mongoose, { Document, Schema } from 'mongoose';

export type FlashcardStudyStatus = 'new' | 'learning' | 'review' | 'mastered';

export interface IFlashcardProgress extends Document {
  userId: mongoose.Types.ObjectId;
  flashcardId: mongoose.Types.ObjectId;
  deckId: mongoose.Types.ObjectId;
  viewCount: number;
  correctCount: number;
  incorrectCount: number;
  lastReviewedAt?: Date;
  nextReviewAt?: Date;
  easinessFactor: number;
  interval: number;
  repetitions: number;
  lastReviewId?: string;
  status: FlashcardStudyStatus;
  createdAt: Date;
  updatedAt: Date;
}

const FlashcardProgressSchema = new Schema<IFlashcardProgress>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    flashcardId: { type: Schema.Types.ObjectId, ref: 'Flashcard', required: true, index: true },
    deckId: { type: Schema.Types.ObjectId, ref: 'FlashcardDeck', required: true, index: true },
    viewCount: { type: Number, default: 0, min: 0 },
    correctCount: { type: Number, default: 0, min: 0 },
    incorrectCount: { type: Number, default: 0, min: 0 },
    lastReviewedAt: Date,
    nextReviewAt: Date,
    easinessFactor: { type: Number, default: 2.5, min: 1.3 },
    interval: { type: Number, default: 0, min: 0 },
    repetitions: { type: Number, default: 0, min: 0 },
    lastReviewId: { type: String, trim: true },
    status: { type: String, enum: ['new', 'learning', 'review', 'mastered'], default: 'new' },
  },
  { timestamps: true }
);

FlashcardProgressSchema.index({ userId: 1, flashcardId: 1 }, { unique: true });
FlashcardProgressSchema.index({ userId: 1, nextReviewAt: 1 });

export const FlashcardProgress = mongoose.model<IFlashcardProgress>('FlashcardProgress', FlashcardProgressSchema);
