import { Schema, model } from 'mongoose';
import type { SessionDoc } from '../types/index.js';

const sessionSchema = new Schema<SessionDoc>(
  {
    title: {
      type: String,
      required: [true, 'Session title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters long'],
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },

    subject: {
      type: String,
      trim: true,
      default: 'General Tutoring',
    },

    description: {
      type: String,
      trim: true,
      default: '',
    },

    status: {
      type: String,
      enum: {
        values: ['available', 'planned', 'in-progress', 'completed', 'cancelled'],
        message: 'Status must be one of: available, planned, in-progress, completed, cancelled',
      },
      default: 'available',
    },

    ratePerHour: {
      type: Number,
      min: [0, 'Rate per hour cannot be negative'],
      default: 20,
    },

    durationMinutes: {
      type: Number,
      required: [true, 'Duration is required'],
      min: [1, 'Duration must be at least 1 minute'],
      max: [480, 'Duration cannot exceed 480 minutes (8 hours)'],
      default: 60,
    },

    availableSlots: {
      type: Number,
      min: [0, 'Available slots cannot be negative'],
      default: 1,
    },

    notes: {
      type: String,
      trim: true,
      default: '',
    },

    // ── ref to User (tutor / owner) ──────────────────────────────────────────
    tutorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },

    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Session must belong to a tutor'],
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        ret['id'] = (ret['_id'] as { toString(): string }).toString();
        ret['_id'] = undefined;
        ret['__v'] = undefined;
        return ret;
      },
    },
  }
);

// Pre-validate or pre-save hook to ensure tutorId defaults to userId
sessionSchema.pre('save', function (next) {
  if (!this.tutorId && this.userId) {
    this.tutorId = this.userId;
  }
  next();
});

// Indexes for fast lookups
sessionSchema.index({ userId: 1, createdAt: -1 });
sessionSchema.index({ subject: 1 });
sessionSchema.index({ status: 1 });

const SessionModel = model<SessionDoc>('Session', sessionSchema);
export default SessionModel;
