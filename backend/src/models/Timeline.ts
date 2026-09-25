import mongoose, { Schema, Document } from 'mongoose';

export interface ITimelineEvent {
  year: number;
  month?: string;
  title: string;
  description: string;
  significance?: string;
  relatedActs?: string[];
  relatedCases?: string[];
}

export interface ITimeline extends Document {
  title: string;
  subject: string;
  topicId: string;
  events: ITimelineEvent[];
  description: string;
  startYear: number;
  endYear: number;
  createdAt: Date;
  updatedAt: Date;
}

const TimelineEventSchema = new Schema<ITimelineEvent>(
  {
    year: {
      type: Number,
      required: true,
    },
    month: String,
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    significance: String,
    relatedActs: [String],
    relatedCases: [String],
  },
  { _id: false }
);

const TimelineSchema = new Schema<ITimeline>(
  {
    title: {
      type: String,
      required: true,
      index: true,
    },
    subject: {
      type: String,
      required: true,
      index: true,
    },
    topicId: {
      type: String,
      index: true,
    },
    events: [TimelineEventSchema],
    description: {
      type: String,
      default: '',
    },
    startYear: {
      type: Number,
    },
    endYear: {
      type: Number,
    },
  },
  { timestamps: true }
);

// Text index for searching
TimelineSchema.index({ title: 'text', description: 'text', 'events.title': 'text' });

export const Timeline = mongoose.model<ITimeline>('Timeline', TimelineSchema);
