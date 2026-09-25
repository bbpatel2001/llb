import mongoose, { Schema, Document } from 'mongoose';
import { AnswerLanguage } from '../config/languages';

export interface ICaseReference {
  caseName: string;
  citation: string;
  year: number;
  court: string;
  relevantPrinciple: string;
  relevantSections?: string[];
}

export interface IActReference {
  actName: string;
  sections: Array<{
    number: string;
    title: string;
    summary: string;
  }>;
}

export interface IMCQOption {
  label: 'A' | 'B' | 'C' | 'D';
  text: string;
  isCorrect: boolean;
  explanation?: string;
}

export interface IAnswerWritingGuide {
  answerType: 'short' | 'long';
  marks: number;
  targetPages: string;
  targetWords: string;
  sections: string[];
  include: string[];
  statutoryProvisions: string[];
  caseExamples: string[];
  modelAnswer: string;
}

export interface IAnswer extends Document {
  questionId: mongoose.Types.ObjectId;
  paperId: mongoose.Types.ObjectId;
  type: 'short' | 'long' | 'standard' | 'mcq' | 'case_study';
  language?: AnswerLanguage;
  text: string;
  wordCount: number;
  keyPoints: string[];
  casesReferred: ICaseReference[];
  actsReferred: IActReference[];
  studyTips: string[];
  writingGuide?: IAnswerWritingGuide;
  difficulty: 'easy' | 'medium' | 'hard';
  generatedBy: 'ai' | 'manual' | 'both';
  qualityScore: number;
  verified: boolean;
  
  // MCQ specific fields
  mcqOptions?: IMCQOption[];
  mcqExplanation?: string;
  
  // Case Study specific fields
  caseScenario?: string;
  questions?: Array<{
    subQuestion: string;
    expectedAnswer: string;
    marks: number;
  }>;
  
  // Meta fields
  sources: Array<{
    type: 'textbook' | 'case_law' | 'statute' | 'article';
    title: string;
    author?: string;
    year?: number;
  }>;
  
  createdAt: Date;
  updatedAt: Date;
}

const CaseReferenceSchema = new Schema<ICaseReference>({
  caseName: { type: String, required: true },
  citation: { type: String, required: true },
  year: { type: Number },
  court: { type: String },
  relevantPrinciple: { type: String, required: true },
  relevantSections: [String],
}, { _id: false });

const ActReferenceSchema = new Schema<IActReference>({
  actName: { type: String, required: true },
  sections: [{
    number: String,
    title: String,
    summary: String,
  }],
}, { _id: false });

const MCQOptionSchema = new Schema<IMCQOption>({
  label: { type: String, enum: ['A', 'B', 'C', 'D'], required: true },
  text: { type: String, required: true },
  isCorrect: { type: Boolean, required: true },
  explanation: String,
}, { _id: false });

const AnswerSchema = new Schema<IAnswer>(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true,
      index: true,
    },
    paperId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Paper',
      index: true,
    },
    type: {
      type: String,
      enum: ['short', 'long', 'standard', 'mcq', 'case_study'],
      default: 'standard',
      index: true,
    },
    language: {
      type: String,
      enum: ['en', 'gu'],
      default: 'en',
      index: true,
    },
    text: {
      type: String,
    },
    wordCount: {
      type: Number,
      default: 0,
    },
    keyPoints: [String],
    casesReferred: [CaseReferenceSchema],
    actsReferred: [ActReferenceSchema],
    studyTips: [String],
    writingGuide: {
      answerType: { type: String, enum: ['short', 'long'] },
      marks: Number,
      targetPages: String,
      targetWords: String,
      sections: [String],
      include: [String],
      statutoryProvisions: [String],
      caseExamples: [String],
      modelAnswer: String,
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      index: true,
    },
    generatedBy: {
      type: String,
      enum: ['ai', 'manual', 'both'],
      default: 'ai',
    },
    qualityScore: {
      type: Number,
      min: 0,
      max: 10,
      default: 7,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    // MCQ specific
    mcqOptions: [MCQOptionSchema],
    mcqExplanation: String,
    
    // Case Study specific
    caseScenario: String,
    questions: [{
      subQuestion: String,
      expectedAnswer: String,
      marks: Number,
    }],
    
    // Sources
    sources: [{
      type: { type: String, enum: ['textbook', 'case_law', 'statute', 'article'] },
      title: String,
      author: String,
      year: Number,
    }],
  },
  { timestamps: true }
);

// Text index for searching
AnswerSchema.index({ text: 'text', keyPoints: 'text' });
AnswerSchema.index({ type: 1, difficulty: 1 });
AnswerSchema.index({ questionId: 1, type: 1, language: 1 });

export const Answer = mongoose.model<IAnswer>('Answer', AnswerSchema);
