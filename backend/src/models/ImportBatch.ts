import mongoose, { Document, Schema } from 'mongoose';

export type ImportBatchStatus =
  | 'uploaded'
  | 'needs_review'
  | 'approved'
  | 'promoted'
  | 'rejected'
  | 'failed';

export interface IImportBatch extends Document {
  createdBy: mongoose.Types.ObjectId;
  sourceType: 'pdf' | 'json' | 'reconciliation-report';
  contentType: 'question' | 'syllabus';
  sourceFileName: string;
  sourcePath?: string;
  sourceSha256: string;
  fileSize?: number;
  pageCount?: number;
  manifestKey?: string;
  metadata: {
    semester: number;
    subject: string;
    title: string;
    year: number;
    university: string;
  };
  status: ImportBatchStatus;
  questionCount: number;
  acceptedCount: number;
  rejectedCount: number;
  validationSummary: Record<string, number>;
  payload?: Record<string, unknown>;
  errorMessages: string[];
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  promotedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ImportBatchSchema = new Schema<IImportBatch>(
  {
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    sourceType: {
      type: String,
      enum: ['pdf', 'json', 'reconciliation-report'],
      required: true,
    },
    contentType: { type: String, enum: ['question', 'syllabus'], default: 'question', index: true },
    sourceFileName: { type: String, required: true, trim: true },
    sourcePath: { type: String, trim: true },
    sourceSha256: { type: String, required: true, trim: true, index: true },
    fileSize: { type: Number, min: 0 },
    pageCount: { type: Number, min: 1 },
    manifestKey: { type: String, trim: true },
    metadata: {
      semester: { type: Number, required: true, min: 1, max: 6 },
      subject: { type: String, required: true, trim: true },
      title: { type: String, required: true, trim: true },
      year: { type: Number, required: true, min: 1900, max: 2200 },
      university: { type: String, required: true, trim: true },
    },
    status: {
      type: String,
      enum: ['uploaded', 'needs_review', 'approved', 'promoted', 'rejected', 'failed'],
      default: 'uploaded',
      index: true,
    },
    questionCount: { type: Number, default: 0 },
    acceptedCount: { type: Number, default: 0 },
    rejectedCount: { type: Number, default: 0 },
    validationSummary: { type: Schema.Types.Mixed, default: {} },
    payload: { type: Schema.Types.Mixed },
    errorMessages: { type: [String], default: [] },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedAt: Date,
    promotedAt: Date,
  },
  { timestamps: true }
);

ImportBatchSchema.index({ sourceSha256: 1, sourceFileName: 1 }, { unique: true });

export const ImportBatch = mongoose.model<IImportBatch>('ImportBatch', ImportBatchSchema);
