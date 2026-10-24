import { Document, Types } from 'mongoose';

// ─── User ────────────────────────────────────────────────────────────────────

export type UserRole = 'tutor' | 'tutee' | 'user' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  password: string; // select:false on schema
  createdAt: Date;
  updatedAt: Date;
}

/** Mongoose document type for User */
export type UserDoc = Document<Types.ObjectId> &
  Omit<User, 'id'> & {
    _id: Types.ObjectId;
    comparePassword?: (candidate: string) => Promise<boolean>;
  };

// ─── Tutoring Session ───────────────────────────────────────────────────────

export type SessionStatus = 'available' | 'planned' | 'in-progress' | 'completed' | 'cancelled';

export interface Session {
  id: string;
  title: string;
  subject: string;
  description: string;
  status: SessionStatus;
  ratePerHour: number;
  durationMinutes: number;
  availableSlots: number;
  notes: string;
  tutorId: string;
  userId: string; // alias/ref to tutor
  createdAt: Date;
  updatedAt: Date;
}

export type SessionDoc = Document<Types.ObjectId> &
  Omit<Session, 'id' | 'userId' | 'tutorId'> & {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    tutorId: Types.ObjectId;
  };

export type CreateSessionInput = {
  title: string;
  subject?: string;
  description?: string;
  status?: SessionStatus;
  ratePerHour?: number;
  durationMinutes: number;
  availableSlots?: number;
  notes?: string;
};

export type UpdateSessionInput = Partial<CreateSessionInput>;

// ─── Booking ─────────────────────────────────────────────────────────────────

export type BookingStatus = 'requested' | 'confirmed' | 'completed' | 'cancelled';

export interface Booking {
  id: string;
  sessionId: string;
  tuteeId: string;
  tutorId: string;
  status: BookingStatus;
  scheduledAt: Date;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

export type BookingDoc = Document<Types.ObjectId> &
  Omit<Booking, 'id' | 'sessionId' | 'tuteeId' | 'tutorId'> & {
    _id: Types.ObjectId;
    sessionId: Types.ObjectId;
    tuteeId: Types.ObjectId;
    tutorId: Types.ObjectId;
  };

export type CreateBookingInput = {
  sessionId: string;
  scheduledAt: string | Date;
  notes?: string;
};

export type UpdateBookingStatusInput = {
  status: BookingStatus;
  notes?: string;
};

// ─── Auth payloads ───────────────────────────────────────────────────────────

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface JwtPayload {
  userId: string;
}
