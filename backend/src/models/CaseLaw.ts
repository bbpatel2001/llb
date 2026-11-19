import mongoose, { Schema, Document } from 'mongoose';

export interface ICaseLaw extends Document {
  name: string;
  citation: string;
  court: string;
  year: number;
  facts: string;
  issue: string;
  held: string;
  ratio: string;
  significance: string;
  applicableActs: string[];
  relatedTopics: string[];
  frequency: number;
  lastAskedYear: number;
  caseNumber?: string;
  judgmentDate?: string;
  bench?: string;
  sourceUrl?: string;
  downloadUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CaseLawSchema = new Schema<ICaseLaw>(
  {
    name: {
      type: String,
      required: true,
      index: true,
    },
    citation: {
      type: String,
      required: true,
      unique: true,
    },
    court: {
      type: String,
      required: true,
      index: true,
    },
    year: {
      type: Number,
      required: true,
      index: true,
    },
    facts: {
      type: String,
      required: true,
    },
    issue: {
      type: String,
      required: true,
    },
    held: {
      type: String,
      required: true,
    },
    ratio: {
      type: String,
      required: true,
    },
    significance: {
      type: String,
    },
    applicableActs: [String],
    relatedTopics: [String],
    frequency: {
      type: Number,
      default: 0,
      index: true,
    },
    lastAskedYear: Number,
    caseNumber: String,
    judgmentDate: String,
    bench: String,
    sourceUrl: String,
    downloadUrl: String,
  },
  { timestamps: true }
);

// Text index for comprehensive search
CaseLawSchema.index({ name: 'text', facts: 'text', held: 'text', ratio: 'text' });

export const CaseLaw = mongoose.model<ICaseLaw>('CaseLaw', CaseLawSchema);
