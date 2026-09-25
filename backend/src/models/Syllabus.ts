import mongoose, { Document, Schema } from 'mongoose';

export type SyllabusStatus = 'draft' | 'published' | 'archived';
export type SyllabusCourseCategory = 'core' | 'foundation' | 'elective' | 'soft-skill';

export interface ISyllabusTopic {
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

export interface ISyllabus extends Document {
  syllabusKey: string;
  version: number;
  status: SyllabusStatus;
  university: string;
  programme: string;
  academicYear: string;
  semester: number;
  subject: string;
  subjectCode: string;
  courseCategory: SyllabusCourseCategory;
  lectureHoursPerWeek: number;
  otherHoursPerWeek: number;
  weeklyHours: number;
  credits?: number;
  maxMarks?: number;
  description?: string;
  objectives: string[];
  outcomes: string[];
  topics: ISyllabusTopic[];
  references: string[];
  contentPolicy?: string;
  assessmentPattern?: {
    endSemesterExam?: number;
    internalAssessment?: number;
    totalMarks?: number;
    components?: Array<{ name: string; marks: number }>;
  };
  source: {
    format: 'json' | 'pdf';
    fileName: string;
    sha256: string;
  };
  importBatchId?: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SyllabusTopicSchema = new Schema<ISyllabusTopic>(
  {
    topicKey: { type: String, required: true, trim: true },
    sourceId: { type: String, required: true, trim: true },
    parentTopicKey: { type: String, trim: true },
    name: { type: String, required: true, trim: true },
    order: { type: Number, required: true, min: 1 },
    kind: { type: String, enum: ['unit', 'topic'], default: 'topic' },
    description: { type: String, trim: true },
    estimatedHours: { type: Number, min: 0 },
    keyTerms: { type: [String], default: [] },
    relatedSections: { type: [String], default: [] },
  },
  { _id: false }
);

const SyllabusSchema = new Schema<ISyllabus>(
  {
    syllabusKey: { type: String, required: true, trim: true, index: true },
    version: { type: Number, required: true, min: 1 },
    status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft', index: true },
    university: { type: String, required: true, trim: true },
    programme: { type: String, required: true, trim: true },
    academicYear: { type: String, required: true, trim: true, index: true },
    semester: { type: Number, required: true, min: 1, max: 6, index: true },
    subject: { type: String, required: true, trim: true, index: true },
    subjectCode: { type: String, required: true, trim: true, index: true },
    courseCategory: { type: String, enum: ['core', 'foundation', 'elective', 'soft-skill'], required: true },
    lectureHoursPerWeek: { type: Number, required: true, min: 0, max: 100 },
    otherHoursPerWeek: { type: Number, required: true, min: 0, max: 100 },
    weeklyHours: { type: Number, required: true, min: 0, max: 100 },
    credits: { type: Number, min: 0, max: 100 },
    maxMarks: { type: Number, min: 0, max: 1000 },
    description: { type: String, trim: true, maxlength: 2000 },
    objectives: { type: [String], default: [] },
    outcomes: { type: [String], default: [] },
    topics: { type: [SyllabusTopicSchema], required: true },
    references: { type: [String], default: [] },
    contentPolicy: { type: String, trim: true, maxlength: 300 },
    assessmentPattern: {
      endSemesterExam: { type: Number, min: 0, max: 1000 },
      internalAssessment: { type: Number, min: 0, max: 1000 },
      totalMarks: { type: Number, min: 0, max: 1000 },
      components: {
        type: [{ name: { type: String, required: true, trim: true }, marks: { type: Number, min: 0, max: 1000, required: true } }],
        default: [],
      },
    },
    source: {
      format: { type: String, enum: ['json', 'pdf'], required: true },
      fileName: { type: String, required: true, trim: true },
      sha256: { type: String, required: true, trim: true },
    },
    importBatchId: { type: Schema.Types.ObjectId, ref: 'ImportBatch', index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    publishedAt: Date,
  },
  { timestamps: true }
);

SyllabusSchema.index({ syllabusKey: 1, version: 1 }, { unique: true });
SyllabusSchema.index({ 'source.sha256': 1 }, { unique: true });
SyllabusSchema.index({ status: 1, semester: 1, subjectCode: 1 });

export const Syllabus = mongoose.model<ISyllabus>('Syllabus', SyllabusSchema);
