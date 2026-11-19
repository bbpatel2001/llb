/**
 * Database Models
 * All MongoDB schemas for the LLB Knowledge Platform
 */

export interface ISemester {
  number: 1 | 2 | 3 | 4 | 5 | 6;
  name: string;
}

export interface IUniversity {
  code: string;
  name: string;
  location: string;
}

/**
 * Paper Schema
 * Represents a question paper
 */
export interface IPaper {
  _id?: string;
  title: string;
  university: string;
  semester: number;
  subject: string;
  subjectCode: string;
  year: number;
  month?: string;
  filePath: string;
  fileName: string;
  extractedText: string;
  pageCount: number;
  wordCount: number;
  difficulty?: "easy" | "medium" | "hard";
  generatedPath?: string;
  status: "pending" | "processing" | "completed" | "failed";
  metadata?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Syllabus Schema
 * Represents course syllabus with topics
 */
export interface ISyllabus {
  _id?: string;
  university: string;
  semester: number;
  subject: string;
  subjectCode: string;
  topics: ITopic[];
  description?: string;
  credits?: number;
  objectives?: string[];
  outcomes?: string[];
  references?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Topic Schema
 * Represents a topic/unit in syllabus
 */
export interface ITopic {
  _id?: string;
  syllabusId?: string;
  name: string;
  description?: string;
  subtopics?: string[];
  relatedSections?: string[];
  keyTerms?: string[];
  difficulty?: "beginner" | "intermediate" | "advanced";
  estimatedHours?: number;
  order?: number;
  parentTopicId?: string; // For nested topics
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Question Schema
 * Represents an individual question
 */
export interface IQuestion {
  _id?: string;
  paperId: string;
  syllabusTopics: string[]; // Links to topics
  questionNumber?: string;
  text: string;
  type: "short" | "long" | "descriptive" | "case-based" | "mcq" | "fill-blank";
  marks?: number;
  section?: string;
  difficulty?: "easy" | "medium" | "hard";
  frequency?: number; // How many times appeared in last 10 years
  lastAskedYear?: number;
  relatedCases?: string[];
  relatedSections?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Answer Schema
 * Represents answers to questions
 */
export interface IAnswer {
  _id?: string;
  questionId: string;
  paperId: string;
  type: "short" | "long" | "standard";
  text: string;
  wordCount?: number;
  keyPoints?: string[];
  casesReferred?: string[];
  actionsReferred?: string[];
  studyTips?: string[];
  difficulty?: string;
  generatedBy?: "ai" | "manual" | "both";
  qualityScore?: number; // 1-10
  verified?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Flashcard Schema
 * Represents individual flashcards
 */
export interface IFlashcard {
  _id?: string;
  deckId: string;
  front: string; // Question/prompt
  back: string; // Answer
  category: "definition" | "section" | "case" | "principle" | "concept" | "act" | "timeline";
  topicId?: string;
  difficulty?: "easy" | "medium" | "hard";
  tags?: string[];
  relatedCases?: string[];
  examples?: string[];
  mnemonics?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Flashcard Deck Schema
 * Collection of flashcards
 */
export interface IFlashcardDeck {
  _id?: string;
  name: string;
  subject: string;
  semester: number;
  description?: string;
  flashcards: string[]; // IDs of flashcards
  cardCount?: number;
  difficulty?: string;
  createdBy?: string;
  isPublic: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Timeline Schema
 * Represents chronological information
 */
export interface ITimeline {
  _id?: string;
  title: string;
  subject: string;
  topicId?: string;
  events: ITimelineEvent[];
  description?: string;
  startYear?: number;
  endYear?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ITimelineEvent {
  year: number;
  month?: string;
  title: string;
  description: string;
  significance?: string;
  relatedActs?: string[];
  relatedCases?: string[];
}

/**
 * Case Law Schema
 * Represents important court cases
 */
export interface ICaseLaw {
  _id?: string;
  name: string;
  citation: string;
  court: string;
  year: number;
  facts: string;
  issue: string;
  held: string;
  ratio: string; // Ratio decidendi
  significance: string;
  applicableActs?: string[];
  relatedTopics?: string[];
  frequency?: number; // Times asked in papers
  lastAskedYear?: number;
  caseNumber?: string;
  judgmentDate?: string;
  bench?: string;
  sourceUrl?: string;
  downloadUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Bare Act Schema
 * Represents legislation and acts
 */
export interface IBareAct {
  _id?: string;
  actName: string;
  year: number;
  fullText?: string;
  sections: IBareActSection[];
  subject: string;
  frequency?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IBareActSection {
  section: string;
  title?: string;
  text: string;
  relatedCases?: string[];
  interpretations?: string[];
}

/**
 * Practice Test Schema
 * Represents a practice test
 */
export interface IPracticeTest {
  _id?: string;
  title: string;
  subject: string;
  semester: number;
  questions: IPracticeQuestion[];
  totalMarks: number;
  duration?: number; // in minutes
  difficulty?: string;
  topics?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IPracticeQuestion {
  questionId: string;
  text: string;
  marks: number;
  options?: string[]; // For MCQs
  correctAnswer?: string;
  explanation?: string;
}

/**
 * User Progress Schema
 * Tracks student progress
 */
export interface IUserProgress {
  _id?: string;
  userId: string;
  paperId: string;
  topicId?: string;
  questionsViewed: number;
  questionsAnswered: number;
  correctAnswers?: number;
  bookmarkedItems: string[];
  lastViewedAt?: Date;
  completionPercentage?: number;
  estimatedTime?: number; // minutes
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Flashcard Progress Schema
 * Tracks flashcard learning
 */
export interface IFlashcardProgress {
  _id?: string;
  userId: string;
  deckId: string;
  flashcardId: string;
  viewCount: number;
  correctCount: number;
  incorrectCount: number;
  lastReviewedAt?: Date;
  nextReviewAt?: Date;
  easinessFactor: number; // Spaced repetition algorithm
  interval: number; // days
  status: "new" | "learning" | "review" | "mastered";
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Test Attempt Schema
 * Tracks practice test attempts
 */
export interface ITestAttempt {
  _id?: string;
  userId: string;
  testId: string;
  answers: Record<string, string>; // questionId: answer
  score?: number;
  totalMarks?: number;
  percentage?: number;
  timeTaken?: number;
  startedAt: Date;
  submittedAt: Date;
  analysis?: {
    correctCount: number;
    incorrectCount: number;
    skippedCount: number;
    topicsStrength?: Record<string, number>;
    topicsWeakness?: Record<string, number>;
  };
}

/**
 * User Schema
 * Represents a student or instructor
 */
export interface IUser {
  _id?: string;
  email: string;
  password: string;
  name: string;
  role: "student" | "instructor" | "admin";
  semester?: number;
  subjects?: string[];
  avatar?: string;
  bio?: string;
  university?: string;
  isVerified?: boolean;
  lastLoginAt?: Date;
  preferences?: {
    language?: string;
    theme?: "light" | "dark";
    emailNotifications?: boolean;
    dailyGoal?: number; // minutes
  };
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Generation Log Schema
 * Tracks content generation
 */
export interface IGenerationLog {
  _id?: string;
  paperId?: string;
  syllabusId?: string;
  mode: "paper" | "syllabus" | "combined";
  status: "pending" | "processing" | "completed" | "failed";
  contentTypes: string[]; // Types generated
  startedAt: Date;
  completedAt?: Date;
  duration?: number; // seconds
  totalPapers?: number;
  successCount?: number;
  failureCount?: number;
  generatedFiles?: string[];
  errors?: string[];
  metadata?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Content Metadata Schema
 * Stores metadata about generated content
 */
export interface IContentMetadata {
  _id?: string;
  paperId?: string;
  topicId?: string;
  contentTypes: {
    shortAnswers: boolean;
    longAnswers: boolean;
    flashcards: boolean;
    timelines: boolean;
    conceptMaps: boolean;
    caseSummaries: boolean;
    bareActs: boolean;
    revisionNotes: boolean;
    practiceTests: boolean;
  };
  wordCounts?: Record<string, number>;
  contentQuality?: Record<string, number>;
  generationDate?: Date;
  generatedBy?: "system" | "manual" | "hybrid";
  aiModel?: string;
  updateDate?: Date;
}

/**
 * Batch Job Schema
 * Tracks batch processing jobs
 */
export interface IBatchJob {
  _id?: string;
  name: string;
  type: "generate" | "validate" | "index" | "aggregate";
  status: "pending" | "running" | "completed" | "failed";
  parameters: Record<string, any>;
  progress: number; // 0-100
  totalItems: number;
  processedItems: number;
  startedAt: Date;
  completedAt?: Date;
  errors?: string[];
  results?: Record<string, any>;
  createdBy?: string;
}

// Export actual model classes
export { Paper } from './Paper';
export { Question } from './Question';
export { ExtractionLog } from './ExtractionLog';
export { Answer } from './Answer';
export { Flashcard, FlashcardDeck } from './Flashcard';
export { Timeline } from './Timeline';
export { CaseLaw } from './CaseLaw';
export { Quiz, QuizAttempt } from './Quiz';
export { User } from './User';
export { ImportBatch } from './ImportBatch';
export { StagedQuestion } from './StagedQuestion';
export { Bookmark } from './Bookmark';
export { Note } from './Note';
export { StudyProgress } from './StudyProgress';
export { FlashcardProgress } from './FlashcardProgress';
export { Syllabus } from './Syllabus';
export { AuditLog } from './AuditLog';
