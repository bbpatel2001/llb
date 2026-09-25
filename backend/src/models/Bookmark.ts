import mongoose, { Document, Schema } from 'mongoose';

export type BookmarkTargetType = 'question' | 'answer' | 'flashcard' | 'case_law' | 'paper' | 'quiz';

export interface IBookmark extends Document {
  userId: mongoose.Types.ObjectId;
  targetType: BookmarkTargetType;
  targetId: string;
  label?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BookmarkSchema = new Schema<IBookmark>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    targetType: {
      type: String,
      enum: ['question', 'answer', 'flashcard', 'case_law', 'paper', 'quiz'],
      required: true,
    },
    targetId: { type: String, required: true, trim: true },
    label: { type: String, trim: true, maxlength: 100 },
  },
  { timestamps: true }
);

BookmarkSchema.index({ userId: 1, targetType: 1, targetId: 1 }, { unique: true });

export const Bookmark = mongoose.model<IBookmark>('Bookmark', BookmarkSchema);
