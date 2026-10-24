import mongoose, { Schema, model } from 'mongoose';
import bcrypt from 'bcryptjs';
import type { UserDoc } from '../types/index.js';

const userSchema = new Schema<UserDoc>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    role: {
      type: String,
      enum: {
        values: ['tutor', 'tutee', 'user', 'admin'],
        message: 'Role must be tutor, tutee, user, or admin',
      },
      default: 'tutee',
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // excluded from query results by default
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        ret['id'] = (ret['_id'] as { toString(): string }).toString();
        ret['_id'] = undefined;
        ret['__v'] = undefined;
        ret['password'] = undefined; // never expose password in JSON
        return ret;
      },
    },
  }
);

// ── pre-save hook: hash password only when it is new or modified ─────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

const UserModel = model<UserDoc>('User', userSchema);
export default UserModel;
