import mongoose, { Schema, Document } from 'mongoose';

export interface IQuizQuestion {
  questionId: mongoose.Types.ObjectId;
  marks: number;
  order: number;
}

export interface IQuiz extends Document {
  title: string;
  description: string;
  subject: string;
  semester: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  totalMarks: number;
  duration: number; // in minutes
  questions: IQuizQuestion[];
  createdBy: string; // admin ID
  isPaid: boolean;
  visibility: 'public' | 'private' | 'draft';
  tags: string[];
  statistics: {
    totalAttempts: number;
    averageScore: number;
    averageTime: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface IQuizAttempt extends Document {
  quizId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  answers: Array<{
    questionId: mongoose.Types.ObjectId;
    selectedAnswer: string;
    isCorrect: boolean;
    marksObtained: number;
    timeSpent: number; // in seconds
  }>;
  totalScore: number;
  totalMarks: number;
  percentage: number;
  status: 'in_progress' | 'submitted' | 'graded';
  startedAt: Date;
  submittedAt?: Date;
  feedback?: string;
  createdAt: Date;
  updatedAt: Date;
}

const QuizQuestionSchema = new Schema<IQuizQuestion>(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true,
    },
    marks: {
      type: Number,
      required: true,
    },
    order: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

const QuizStatisticsSchema = new Schema(
  {
    totalAttempts: { type: Number, default: 0 },
    averageScore: { type: Number, default: 0 },
    averageTime: { type: Number, default: 0 },
  },
  { _id: false }
);

const QuizSchema = new Schema<IQuiz>(
  {
    title: {
      type: String,
      required: true,
      index: true,
    },
    description: String,
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
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'intermediate',
    },
    totalMarks: {
      type: Number,
      required: true,
    },
    duration: {
      type: Number,
      required: true, // in minutes
    },
    questions: [QuizQuestionSchema],
    createdBy: {
      type: String,
      required: true,
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    visibility: {
      type: String,
      enum: ['public', 'private', 'draft'],
      default: 'draft',
      index: true,
    },
    tags: [String],
    statistics: QuizStatisticsSchema,
  },
  { timestamps: true }
);

const QuizAttemptSchema = new Schema<IQuizAttempt>(
  {
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quiz',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    answers: [
      {
        questionId: mongoose.Schema.Types.ObjectId,
        selectedAnswer: String,
        isCorrect: Boolean,
        marksObtained: Number,
        timeSpent: Number,
        _id: false,
      },
    ],
    totalScore: {
      type: Number,
      default: 0,
    },
    totalMarks: {
      type: Number,
      required: true,
    },
    percentage: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['in_progress', 'submitted', 'graded'],
      default: 'in_progress',
      index: true,
    },
    startedAt: {
      type: Date,
      default: () => new Date(),
    },
    submittedAt: Date,
    feedback: String,
  },
  { timestamps: true }
);

// Indexes
QuizSchema.index({ subject: 1, semester: 1 });
QuizSchema.index({ createdBy: 1, visibility: 1 });
QuizSchema.index({ visibility: 1, isPaid: 1 });

QuizAttemptSchema.index({ quizId: 1, userId: 1 });
QuizAttemptSchema.index({ status: 1, submittedAt: 1 });

export const Quiz = mongoose.model<IQuiz>('Quiz', QuizSchema);
export const QuizAttempt = mongoose.model<IQuizAttempt>('QuizAttempt', QuizAttemptSchema);
