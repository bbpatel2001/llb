import mongoose, { Document, Schema } from 'mongoose';

export type StagedQuestionStatus = 'pending' | 'accepted' | 'rejected' | 'needs_changes' | 'promoted';

export interface IStagedQuestion extends Document {
  batchId: mongoose.Types.ObjectId;
  questionNumber: string;
  questionText: string;
  rawText?: string;
  type: 'SHORT' | 'LONG' | 'MCQ' | 'CASE_STUDY' | 'DESCRIPTIVE';
  marks: number;
  options?: Array<{ label: string; text: string }>;
  correctAnswer?: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  tags: string[];
  sourceFingerprint: string;
  sourceLocation?: { page?: number; span?: string };
  extractionQuality: number;
  validationIssues: string[];
  status: StagedQuestionStatus;
  reviewNotes?: string;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const StagedQuestionSchema = new Schema<IStagedQuestion>(
  {
    batchId: { type: Schema.Types.ObjectId, ref: 'ImportBatch', required: true, index: true },
    questionNumber: { type: String, required: true, trim: true },
    questionText: { type: String, required: true, trim: true },
    rawText: String,
    type: {
      type: String,
      enum: ['SHORT', 'LONG', 'MCQ', 'CASE_STUDY', 'DESCRIPTIVE'],
      default: 'DESCRIPTIVE',
    },
    marks: { type: Number, required: true, min: 1, max: 50 },
    options: [{ label: String, text: String }],
    correctAnswer: String,
    difficulty: { type: String, enum: ['EASY', 'MEDIUM', 'HARD'], default: 'MEDIUM' },
    tags: { type: [String], default: [] },
    sourceFingerprint: { type: String, required: true },
    sourceLocation: { page: Number, span: String },
    extractionQuality: { type: Number, min: 0, max: 100, default: 100 },
    validationIssues: { type: [String], default: [] },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'needs_changes', 'promoted'],
      default: 'pending',
      index: true,
    },
    reviewNotes: String,
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: Date,
  },
  { timestamps: true }
);

StagedQuestionSchema.index({ batchId: 1, sourceFingerprint: 1, questionNumber: 1 });

export const StagedQuestion = mongoose.model<IStagedQuestion>('StagedQuestion', StagedQuestionSchema);
