import mongoose, { Document, Schema } from 'mongoose';

export type StudyTargetType = 'question' | 'answer' | 'flashcard' | 'case_law' | 'paper' | 'quiz' | 'topic';

export interface IStudyProgress extends Document {
  userId: mongoose.Types.ObjectId;
  targetType: StudyTargetType;
  targetId: string;
  viewedCount: number;
  answeredCount: number;
  correctCount: number;
  completedCount: number;
  timeSpentSeconds: number;
  lastViewedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const StudyProgressSchema = new Schema<IStudyProgress>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    targetType: {
      type: String,
      enum: ['question', 'answer', 'flashcard', 'case_law', 'paper', 'quiz', 'topic'],
      required: true,
    },
    targetId: { type: String, required: true, trim: true },
    viewedCount: { type: Number, default: 0, min: 0 },
    answeredCount: { type: Number, default: 0, min: 0 },
    correctCount: { type: Number, default: 0, min: 0 },
    completedCount: { type: Number, default: 0, min: 0 },
    timeSpentSeconds: { type: Number, default: 0, min: 0 },
    lastViewedAt: Date,
    completedAt: Date,
  },
  { timestamps: true }
);

StudyProgressSchema.index({ userId: 1, targetType: 1, targetId: 1 }, { unique: true });

export const StudyProgress = mongoose.model<IStudyProgress>('StudyProgress', StudyProgressSchema);
