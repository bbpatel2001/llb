import mongoose, { Schema, Document } from 'mongoose';

export interface IFlashcardOption {
  label: string;
  text: string;
  explanation?: string;
}

export interface IFlashcard extends Document {
  deckId: mongoose.Types.ObjectId;
  front: string;
  back: string;
  options?: IFlashcardOption[];
  correctAnswer?: string;
  explanation?: string;
  optionSource?: 'source' | 'ai-generated-draft' | 'rule-generated-draft';
  optionStatus?: 'needs_review' | 'approved' | 'rejected';
  optionModel?: string;
  optionGeneratedAt?: Date;
  category: 'definition' | 'section' | 'case' | 'principle' | 'concept' | 'act' | 'timeline';
  topicId?: string;
  sourceQuestionId?: mongoose.Types.ObjectId;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  relatedCases: string[];
  examples: string[];
  mnemonics: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IFlashcardDeck extends Document {
  name: string;
  subject: string;
  semester: number;
  description: string;
  cardCount: number;
  difficulty: string;
  createdBy: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const FlashcardSchema = new Schema<IFlashcard>(
  {
    deckId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FlashcardDeck',
      required: true,
      index: true,
    },
    front: {
      type: String,
      required: true,
    },
    back: {
      type: String,
      required: true,
    },
    options: [
      {
        label: { type: String, required: true },
        text: { type: String, required: true },
        explanation: String,
      },
    ],
    correctAnswer: String,
    explanation: String,
    optionSource: {
      type: String,
      enum: ['source', 'ai-generated-draft', 'rule-generated-draft'],
    },
    optionStatus: {
      type: String,
      enum: ['needs_review', 'approved', 'rejected'],
    },
    optionModel: String,
    optionGeneratedAt: Date,
    category: {
      type: String,
      enum: ['definition', 'section', 'case', 'principle', 'concept', 'act', 'timeline'],
      default: 'concept',
      index: true,
    },
    topicId: {
      type: String,
      index: true,
    },
    sourceQuestionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      index: true,
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
      index: true,
    },
    tags: [String],
    relatedCases: [String],
    examples: [String],
    mnemonics: String,
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

const FlashcardDeckSchema = new Schema<IFlashcardDeck>(
  {
    name: {
      type: String,
      required: true,
      index: true,
    },
    subject: {
      type: String,
      required: true,
      index: true,
    },
    semester: {
      type: Number,
      required: true,
      index: true,
    },
    description: {
      type: String,
      default: '',
    },
    cardCount: {
      type: Number,
      default: 0,
    },
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'intermediate',
    },
    createdBy: {
      type: String,
      default: 'system',
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Text index for searching
FlashcardSchema.index({ front: 'text', back: 'text' });
FlashcardSchema.index({ deckId: 1, sourceQuestionId: 1 }, { unique: true, sparse: true });

FlashcardDeckSchema.index({ name: 'text', description: 'text' });

export const Flashcard = mongoose.model<IFlashcard>('Flashcard', FlashcardSchema);
export const FlashcardDeck = mongoose.model<IFlashcardDeck>('FlashcardDeck', FlashcardDeckSchema);

