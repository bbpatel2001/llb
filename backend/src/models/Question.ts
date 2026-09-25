import mongoose, { Schema, Document } from 'mongoose';

export interface IQuestion extends Document {
  paperId: mongoose.Types.ObjectId;
  semester: number;
  subject: string;
  questionNumber: string;
  type: 'SHORT' | 'LONG' | 'MCQ' | 'CASE_STUDY' | 'DESCRIPTIVE';
  marks: number;
  questionText: string;
  options?: Array<{
    label: string;
    text: string;
    explanation?: string;
  }>;
  correctAnswer?: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  tags: string[];
  source: {
    fileName: string;
    year: number;
    university: string;
  };
  extractionQuality: number;
  importBatchId?: mongoose.Types.ObjectId;
  sourceFingerprint?: string;
  rawText?: string;
  sourceLocation?: { page?: number; span?: string };
  validationIssues: string[];
  topicRefs: Array<{
    syllabusId: mongoose.Types.ObjectId;
    syllabusVersion: number;
    topicKey: string;
  }>;
  reviewStatus?: 'draft' | 'published' | 'rejected';
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const QuestionSchema = new Schema<IQuestion>(
  {
    paperId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Paper',
      required: true,
      index: true,
    },
    semester: {
      type: Number,
      enum: [1, 2, 3, 4, 5, 6],
      required: true,
      index: true,
    },
    subject: {
      type: String,
      required: true,
      index: true,
    },
    questionNumber: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['SHORT', 'LONG', 'MCQ', 'CASE_STUDY', 'DESCRIPTIVE'],
      default: 'DESCRIPTIVE',
      index: true,
    },
    marks: {
      type: Number,
      required: true,
      min: 1,
      max: 50,
    },
    questionText: {
      type: String,
      required: true,
      text: true, // Enable text search
    },
    options: [
      {
        label: String,
        text: String,
        explanation: String,
      },
    ],
    correctAnswer: String,
    difficulty: {
      type: String,
      enum: ['EASY', 'MEDIUM', 'HARD'],
      default: 'MEDIUM',
      index: true,
    },
    tags: [
      {
        type: String,
        index: true,
      },
    ],
    source: {
      fileName: String,
      year: Number,
      university: String,
    },
    extractionQuality: {
      type: Number,
      min: 0,
      max: 100,
      default: 100,
    },
    importBatchId: { type: Schema.Types.ObjectId, ref: 'ImportBatch', index: true },
    sourceFingerprint: { type: String, index: true },
    rawText: String,
    sourceLocation: { page: Number, span: String },
    validationIssues: { type: [String], default: [] },
    topicRefs: [{
      syllabusId: { type: Schema.Types.ObjectId, ref: 'Syllabus', required: true },
      syllabusVersion: { type: Number, required: true, min: 1 },
      topicKey: { type: String, required: true, trim: true },
    }],
    reviewStatus: { type: String, enum: ['draft', 'published', 'rejected'], default: 'published', index: true },
    publishedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Indexes for common queries
QuestionSchema.index({ semester: 1, subject: 1 });
QuestionSchema.index({ paperId: 1, questionNumber: 1 });
QuestionSchema.index({ questionText: 'text', tags: 'text' });
QuestionSchema.index({ 'topicRefs.syllabusId': 1, 'topicRefs.syllabusVersion': 1, 'topicRefs.topicKey': 1 });

// Pre-save hook to clean question text
QuestionSchema.pre('save', function (next) {
  if (this.questionText) {
    // Remove trailing marks/artifacts that shouldn't be part of the question
    this.questionText = this.questionText
      .replace(/\s+\d+\s*$/, '') // Remove trailing marks
      .replace(/\s+OR\s+[^]*$/, '') // Remove OR sections
      .replace(/\s+[a-z]\s*$/, '') // Remove trailing single letters
      .trim();
  }
  next();
});

export const Question = mongoose.model<IQuestion>('Question', QuestionSchema);
