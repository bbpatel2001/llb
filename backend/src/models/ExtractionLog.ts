import mongoose, { Schema, Document } from 'mongoose';

export interface IExtractionLog extends Document {
  paperId: mongoose.Types.ObjectId;
  fileName: string;
  semester: number;
  subject: string;
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED';
  questionCount: {
    found: number;
    parsed: number;
    stored: number;
  };
  extractionErrors: string[];
  duration: number;
  startedAt: Date;
  completedAt: Date;
  createdAt: Date;
}

const ExtractionLogSchema = new Schema<IExtractionLog>(
  {
    paperId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Paper',
    },
    fileName: {
      type: String,
      required: true,
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
    status: {
      type: String,
      enum: ['SUCCESS', 'PARTIAL', 'FAILED'],
      required: true,
      index: true,
    },
    questionCount: {
      found: {
        type: Number,
        default: 0,
      },
      parsed: {
        type: Number,
        default: 0,
      },
      stored: {
        type: Number,
        default: 0,
      },
    },
    extractionErrors: {
      type: [String],
      default: [],
    },
    duration: {
      type: Number,
      default: 0,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Indexes for common queries
ExtractionLogSchema.index({ paperId: 1 });
ExtractionLogSchema.index({ status: 1, createdAt: -1 });

export const ExtractionLog = mongoose.model<IExtractionLog>(
  'ExtractionLog',
  ExtractionLogSchema
);
