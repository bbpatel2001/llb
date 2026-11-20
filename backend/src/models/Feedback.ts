import mongoose, { Document, Schema } from 'mongoose';

export interface IFeedback extends Document {
  name: string;
  email: string;
  category: 'general' | 'bug' | 'content' | 'suggestion' | 'account';
  message: string;
  userId?: mongoose.Types.ObjectId;
  status: 'new' | 'reviewed' | 'resolved';
  createdAt: Date;
  updatedAt: Date;
}

const FeedbackSchema = new Schema<IFeedback>({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
  category: { type: String, enum: ['general', 'bug', 'content', 'suggestion', 'account'], default: 'general', index: true },
  message: { type: String, required: true, trim: true, maxlength: 5000 },
  userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  status: { type: String, enum: ['new', 'reviewed', 'resolved'], default: 'new', index: true },
}, { timestamps: true });

export const Feedback = mongoose.model<IFeedback>('Feedback', FeedbackSchema);
