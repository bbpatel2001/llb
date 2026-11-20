import bcrypt from 'bcryptjs';
import mongoose, { Document, Schema } from 'mongoose';

export type UserRole = 'student' | 'instructor' | 'admin';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  active: boolean;
  verified: boolean;
  lastLoginAt?: Date;
  loginFailureCount: number;
  lockedUntil?: Date;
  passwordResetTokenHash?: string;
  passwordResetExpiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(password: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 120,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: ['student', 'instructor', 'admin'],
      default: 'student',
      index: true,
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    lastLoginAt: Date,
    loginFailureCount: {
      type: Number,
      default: 0,
      select: false,
    },
    lockedUntil: {
      type: Date,
      select: false,
    },
    passwordResetTokenHash: {
      type: String,
      select: false,
    },
    passwordResetExpiresAt: {
      type: Date,
      select: false,
    },
  },
  { timestamps: true }
);

UserSchema.pre('save', async function savePassword(next) {
  if (!this.isModified('passwordHash')) {
    next();
    return;
  }

  try {
    this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
    next();
  } catch (error) {
    next(error as Error);
  }
});

UserSchema.methods.comparePassword = function comparePassword(password: string) {
  return bcrypt.compare(password, this.passwordHash);
};

UserSchema.set('toJSON', {
  transform: (_document, returned) => {
    const sanitized = returned as unknown as Record<string, unknown>;
    delete sanitized.passwordHash;
    delete sanitized.__v;
    return sanitized;
  },
});

export const User = mongoose.model<IUser>('User', UserSchema);
