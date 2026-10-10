import { Schema, model, Types } from 'mongoose';
import type { SessionDoc } from '../types/index.js';

const sessionSchema = new Schema<SessionDoc>(
  {
    // ── Validation rule 1: required ──────────────────────────────────────────
    title: {
      type: String,
      required: [true, 'Session title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters long'],
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },

    description: {
      type: String,
      trim: true,
      default: '',
    },

    // ── Validation rule 2: enum ──────────────────────────────────────────────
    status: {
      type: String,
      enum: {
        values: ['planned', 'in-progress', 'completed', 'cancelled'],
        message: 'Status must be one of: planned, in-progress, completed, cancelled',
      },
      default: 'planned',
    },

    // ── Validation rule 3: min/max range ─────────────────────────────────────
    durationMinutes: {
      type: Number,
      required: [true, 'Duration is required'],
      min: [1, 'Duration must be at least 1 minute'],
      max: [480, 'Duration cannot exceed 480 minutes (8 hours)'],
    },

    notes: {
      type: String,
      trim: true,
      default: '',
    },

    // ── ref to User (owner) ──────────────────────────────────────────────────
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Session must belong to a user'],
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

// Index for fast lookups by owner
sessionSchema.index({ userId: 1, createdAt: -1 });

const SessionModel = model<SessionDoc>('Session', sessionSchema);
export default SessionModel;
