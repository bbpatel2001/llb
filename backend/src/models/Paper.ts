import mongoose, { Schema, Document } from 'mongoose';

export interface IPaper extends Document {
  semester: number;
  subject: string;
  title: string;
  fileName: string;
  year: number;
  university: string;
  totalQuestions?: number;
  totalMarks?: number;
  questionsExtracted?: boolean;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  extractionNotes?: string;
  sourceSha256?: string;
  sourcePath?: string;
  importBatchId?: mongoose.Types.ObjectId;
  reviewStatus?: 'draft' | 'published' | 'rejected';
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PaperSchema = new Schema<IPaper>(
  {
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
    title: {
      type: String,
      required: true,
    },
    fileName: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    year: {
      type: Number,
      required: true,
      index: true,
    },
    university: {
      type: String,
      required: true,
      enum: ['GU', 'TRICHY', 'KES', 'OTHER'],
      index: true,
    },
    totalQuestions: {
      type: Number,
      default: 0,
    },
    totalMarks: {
      type: Number,
      default: 0,
    },
    questionsExtracted: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'],
      default: 'PENDING',
      index: true,
    },
    extractionNotes: String,
    sourceSha256: { type: String, index: true },
    sourcePath: String,
    importBatchId: { type: Schema.Types.ObjectId, ref: 'ImportBatch', index: true },
    reviewStatus: { type: String, enum: ['draft', 'published', 'rejected'], default: 'published', index: true },
    publishedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Indexes for common queries
PaperSchema.index({ semester: 1, subject: 1 });
PaperSchema.index({ year: 1, university: 1 });

export const Paper = mongoose.model<IPaper>('Paper', PaperSchema);
