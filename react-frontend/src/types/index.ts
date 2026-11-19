/**
 * API Response Types
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Paper Types
 */
export interface Paper {
  _id: string;
  title: string;
  semester: number;
  year: number;
  examMonth?: string;
  university: string;
  fileName: string;
  subject?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Question Types
 */
export interface Question {
  _id: string;
  paperId: string;
  questionNumber: string;
  questionText: string;
  questionTextGu?: string;
  type: 'LONG' | 'SHORT' | 'MCQ' | 'CASE_STUDY' | 'DESCRIPTIVE';
  marks?: number;
  semester: number;
  subject: string;
  topic?: string;
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
  tags?: string[];
  options?: Array<{ label: string; text: string }>;
  correctAnswer?: string;
  topicRefs?: Array<{ syllabusId: string; syllabusVersion: number; topicKey: string }>;
  createdAt: string;
  paper?: Pick<Paper, 'title' | 'year' | 'examMonth' | 'university' | 'fileName'>;
  relatedQuestions?: Array<Pick<Question, '_id' | 'questionNumber' | 'questionText' | 'questionTextGu' | 'marks' | 'subject' | 'paperId'> & { paper?: Pick<Paper, 'title' | 'year' | 'examMonth' | 'university'> | null }>;
  reviewStatus?: 'draft' | 'published' | 'rejected' | 'review_required';
}

/**
 * Answer Types
 */
export interface AnswerWritingGuide {
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

export interface Answer {
  _id: string;
  paperId: string;
  questionId?: string;
  type: 'short' | 'long' | 'standard' | 'mcq' | 'case_study' | 'flashcard' | 'case_law' | 'bare_act' | 'revision_note';
  targetMarks?: 5 | 15 | 20 | 25;
  text?: string;
  question?: string;
  answer?: string;
  wordCount?: number;
  keyPoints?: string[];
  studyTips?: string[];
  writingGuide?: AnswerWritingGuide;
  difficulty?: 'easy' | 'medium' | 'hard';
  metadata?: Record<string, unknown>;
  language?: 'en' | 'gu';
  formattedContent?: Array<{ type: 'heading' | 'paragraph' | 'bold' | 'line' | 'table'; text?: string; rows?: string[][] }>;
  reviewStatus?: 'approved' | 'review_required';
  reviewNotes?: string;
  ratingAverage?: number;
  ratingCount?: number;
  createdAt: string;
}

/**
 * Flashcard Types
 */
export interface FlashcardOption {
  label: string;
  text: string;
  explanation?: string;
}

export interface Flashcard {
  _id: string;
  deckId: string;
  sourceQuestionId?: string;
  front: string;
  back: string;
  options?: FlashcardOption[];
  correctAnswer?: string;
  explanation?: string;
  optionSource?: 'source' | 'ai-generated-draft' | 'rule-generated-draft';
  optionStatus?: 'needs_review' | 'approved' | 'rejected';
  category: 'definition' | 'section' | 'case' | 'principle' | 'concept' | 'act' | 'timeline';
  topicId?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags?: string[];
  createdAt: string;
}

export interface FlashcardDeck {
  _id: string;
  name: string;
  subject: string;
  semester: number;
  description: string;
  cardCount: number;
  difficulty: string;
  isPublic: boolean;
  createdAt: string;
}

/**
 * User Types
 */
export interface User {
  id: string;
  _id?: string;
  email: string;
  name: string;
  role: 'student' | 'instructor' | 'admin';
  verified: boolean;
  createdAt?: string;
}

/**
 * Case Law Types
 */
export interface CaseLaw {
  _id: string;
  name: string;
  citation: string;
  court: string;
  year: number;
  facts: string;
  issue: string;
  held: string;
  ratio: string;
  significance: string;
  applicableActs?: string[];
  relatedTopics?: string[];
  frequency?: number;
  lastAskedYear?: number;
  caseNumber?: string;
  judgmentDate?: string;
  bench?: string;
  sourceUrl?: string;
  downloadUrl?: string;
  createdAt: string;
}

export interface QuizQuestion {
  questionId: Question | string;
  marks: number;
  order: number;
}

export interface Quiz {
  _id: string;
  title: string;
  description: string;
  subject: string;
  semester: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  totalMarks: number;
  duration: number;
  questions: QuizQuestion[];
  visibility: 'public' | 'private' | 'draft';
  tags: string[];
}

export interface QuizAttemptSummary {
  attemptId: string;
  quiz: Quiz;
  totalScore: number;
  totalMarks: number;
  percentage: number;
  status: 'in_progress' | 'submitted' | 'graded';
  submittedAt?: string;
}

/**
 * Stats Types
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

/**
 * Plugin Types
 */
export interface PluginStats {
  total: number;
  active: number;
  inactive: number;
}

export interface PluginInfo {
  name: string;
  version: string;
  description: string;
  author: string;
  enabled: boolean;
}

/**
 * Stats Types
 */
export interface Stats {
  totalPapers: number;
  totalQuestions: number;
  byType: Record<string, number>;
  bySemester: Record<string, number>;
  bySubject: Record<string, number>;
}

export interface Bookmark {
  _id: string;
  targetType: string;
  targetId: string;
  label?: string;
  createdAt: string;
}

export interface Note {
  _id: string;
  targetType: string;
  targetId: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export interface StudySummary {
  progress: Array<{ _id: string; items: number; viewed: number; completed: number; timeSpentSeconds: number }>;
  bookmarks: number;
  notes: number;
  dueFlashcards: number;
}

export interface StudyProgress {
  _id: string;
  targetType: string;
  targetId: string;
  viewedCount: number;
  answeredCount: number;
  correctCount: number;
  completedCount: number;
  timeSpentSeconds: number;
  lastViewedAt?: string;
  completedAt?: string;
}

export interface FlashcardProgress {
  _id: string;
  flashcardId: Flashcard | string;
  deckId: string;
  viewCount: number;
  correctCount: number;
  incorrectCount: number;
  easinessFactor: number;
  interval: number;
  repetitions: number;
  status: 'new' | 'learning' | 'review' | 'mastered';
  nextReviewAt?: string;
}

export interface FlashcardSessionAnswer {
  cardId: string;
  selectedAnswer: string;
  isCorrect: boolean;
}

export interface FlashcardSessionSummary {
  totalCards: number;
  objectiveCards: number;
  answeredCards: number;
  correctAnswers: number;
  percentage: number;
  reviewedCards: number;
  answers: FlashcardSessionAnswer[];
}

export interface FlashcardAttempt {
  _id: string;
  deckId: FlashcardDeck | string;
  answers: FlashcardSessionAnswer[];
  totalCards: number;
  objectiveCards: number;
  answeredCards: number;
  correctAnswers: number;
  percentage: number;
  reviewedCards: number;
  startedAt: string;
  completedAt: string;
}

export interface ImportBatch {
  _id: string;
  sourceType: 'pdf' | 'json' | 'reconciliation-report';
  sourceFileName: string;
  sourceSha256: string;
  status: string;
  questionCount: number;
  acceptedCount: number;
  rejectedCount: number;
  metadata: { semester: number; subject: string; title: string; year: number; university: string };
  validationSummary: Record<string, number>;
  createdAt: string;
}

export interface SyllabusTopic {
  topicKey: string;
  sourceId: string;
  parentTopicKey?: string;
  name: string;
  order: number;
  kind?: 'unit' | 'topic';
  description?: string;
  estimatedHours?: number;
  keyTerms: string[];
  relatedSections: string[];
}

export interface Syllabus {
  _id: string;
  syllabusKey: string;
  version: number;
  status: 'draft' | 'published' | 'archived';
  university: string;
  programme: string;
  academicYear: string;
  semester: number;
  subject: string;
  subjectCode: string;
  courseCategory: 'core' | 'foundation' | 'elective' | 'soft-skill';
  lectureHoursPerWeek: number;
  otherHoursPerWeek: number;
  weeklyHours: number;
  credits?: number;
  maxMarks?: number;
  description?: string;
  objectives: string[];
  outcomes: string[];
  topics: SyllabusTopic[];
  references: string[];
  contentPolicy?: string;
  assessmentPattern?: { endSemesterExam?: number; internalAssessment?: number; totalMarks?: number; components?: Array<{ name: string; marks: number }> };
  source: { format: 'json' | 'pdf'; fileName: string; sha256: string };
  importBatchId?: string;
  versionCreatedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SyllabusUniversitySummary {
  university: string;
  syllabusCount: number;
  programmes: string[];
  academicYears: string[];
  semesters: number[];
}

export interface StudyRecommendation {
  topicKey: string;
  name: string;
  parentTopicKey?: string;
  questionCount: number;
  viewedQuestionCount: number;
  coverage: number;
  completedCount: number;
  recommended: boolean;
  reason: string;
}

export interface AuditLog {
  _id: string;
  actorId?: { name?: string; email?: string; role?: string };
  action: string;
  resourceType: string;
  resourceId?: string;
  result: 'success' | 'failure';
  requestId?: string;
  ip?: string;
  createdAt: string;
}
