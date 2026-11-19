import mongoose, { Document, Schema } from 'mongoose';

export interface IAnswerRating extends Document {
  answerId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  rating: number;
  comment?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AnswerRatingSchema = new Schema<IAnswerRating>({
  answerId: { type: Schema.Types.ObjectId, ref: 'Answer', required: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, maxlength: 2000, trim: true },
}, { timestamps: true });

AnswerRatingSchema.index({ answerId: 1, userId: 1 }, { unique: true });

export const AnswerRating = mongoose.model<IAnswerRating>('AnswerRating', AnswerRatingSchema);
