import mongoose, { Document, Schema } from 'mongoose';

export interface IAuditLog extends Document {
  actorId?: mongoose.Types.ObjectId;
  action: string;
  resourceType: string;
  resourceId?: string;
  result: 'success' | 'failure';
  requestId?: string;
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    actorId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    action: { type: String, required: true, trim: true, maxlength: 120, index: true },
    resourceType: { type: String, required: true, trim: true, maxlength: 80 },
    resourceId: { type: String, trim: true, maxlength: 120 },
    result: { type: String, enum: ['success', 'failure'], required: true },
    requestId: { type: String, trim: true, maxlength: 120, index: true },
    ip: { type: String, trim: true, maxlength: 120 },
    userAgent: { type: String, trim: true, maxlength: 500 },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

AuditLogSchema.index({ createdAt: -1 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
