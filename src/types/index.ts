import { Document, Types } from 'mongoose';

// ─── User ────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  password: string; // select:false on schema; only present when explicitly selected
  createdAt: Date;
  updatedAt: Date;
}

/** Mongoose document type for User (password excluded by default via select:false) */
export type UserDoc = Document<Types.ObjectId> &
  Omit<User, 'id'> & {
    _id: Types.ObjectId;
    /** Compare a plain password against the stored hash */
    comparePassword?: (candidate: string) => Promise<boolean>;
  };

// ─── Session (Custom Resource) ───────────────────────────────────────────────

/** Allowed status values for a Session */
export type SessionStatus = 'planned' | 'in-progress' | 'completed' | 'cancelled';

export interface Session {
  id: string;
  title: string;
  description: string;
  status: SessionStatus;
  durationMinutes: number; // 1 – 480
  notes: string;
  userId: string;           // ref → User
  createdAt: Date;
  updatedAt: Date;
}

/** Mongoose document type for Session */
export type SessionDoc = Document<Types.ObjectId> &
  Omit<Session, 'id' | 'userId'> & {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
  };

/** Shape expected in POST /api/sessions body */
export type CreateSessionInput = Omit<Session, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;

/** Shape expected in PATCH /api/sessions/:id body (all fields optional) */
export type UpdateSessionInput = Partial<CreateSessionInput>;

// ─── Auth payloads ───────────────────────────────────────────────────────────

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  role?: 'user' | 'admin';
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface JwtPayload {
  userId: string;
}
