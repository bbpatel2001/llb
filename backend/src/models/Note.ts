import mongoose, { Document, Schema } from 'mongoose';

export type NoteTargetType = 'question' | 'answer' | 'flashcard' | 'case_law' | 'paper' | 'quiz';

export interface INote extends Document {
  userId: mongoose.Types.ObjectId;
  targetType: NoteTargetType;
  targetId: string;
  body: string;
  createdAt: Date;
  updatedAt: Date;
}

const NoteSchema = new Schema<INote>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    targetType: {
      type: String,
      enum: ['question', 'answer', 'flashcard', 'case_law', 'paper', 'quiz'],
      required: true,
    },
    targetId: { type: String, required: true, trim: true },
    body: { type: String, required: true, trim: true, maxlength: 5000 },
  },
  { timestamps: true }
);

NoteSchema.index({ userId: 1, targetType: 1, targetId: 1 });

export const Note = mongoose.model<INote>('Note', NoteSchema);
