import { Schema, model } from 'mongoose';
import type { BookingDoc } from '../types/index.js';

const bookingSchema = new Schema<BookingDoc>(
  {
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: 'Session',
      required: [true, 'Session ID is required'],
    },
    tuteeId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Tutee ID is required'],
    },
    tutorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Tutor ID is required'],
    },
    status: {
      type: String,
      enum: {
        values: ['requested', 'confirmed', 'completed', 'cancelled'],
        message: 'Status must be one of: requested, confirmed, completed, cancelled',
      },
      default: 'requested',
    },
    scheduledAt: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
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

bookingSchema.index({ tuteeId: 1, createdAt: -1 });
bookingSchema.index({ tutorId: 1, createdAt: -1 });
bookingSchema.index({ sessionId: 1 });

const BookingModel = model<BookingDoc>('Booking', bookingSchema);
export default BookingModel;
