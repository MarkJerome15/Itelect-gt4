import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import mongoose from 'mongoose';

import { connectDB } from './config/db.js';
import authRouter from './routes/auth.js';
import sessionsRouter from './routes/sessions.js';
import bookingsRouter from './routes/bookings.js';
import aiRouter from './routes/ai.js';

const app = express();

// ── Global middleware ────────────────────────────────────────────────────────
app.use(
  cors({
    // Allow the Vite dev server and any explicit CORS_ORIGIN env var
    origin: process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
      : ['http://localhost:5173', 'http://localhost:4173'],
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);
app.use(express.json());

// ── Ensure DB connection on every serverless request ─────────────────────────
app.use(async (_req, _res, next) => {
  await connectDB();
  next();
});

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/ai', aiRouter);

// ── 404 fallback ─────────────────────────────────────────────────────────────
app.use((_req: Request, res: Response) => {
  res.status(404).json({ message: 'Route not found' });
});

// ── Global error handler ─────────────────────────────────────────────────────
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  // Mongoose ValidationError
  if (err instanceof mongoose.Error.ValidationError) {
    const errors = Object.values(err.errors).map((e) => e.message);
    res.status(422).json({ message: 'Validation failed', errors });
    return;
  }

  // Mongoose CastError (e.g., bad ObjectId)
  if (err instanceof mongoose.Error.CastError) {
    res.status(400).json({ message: `Invalid value for field "${err.path}": ${err.value}` });
    return;
  }

  // Mongoose duplicate key error (code 11000)
  if (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code: number }).code === 11000
  ) {
    res.status(409).json({ message: 'Duplicate key error: that value already exists' });
    return;
  }

  // Generic fallback
  const message = err instanceof Error ? err.message : 'Internal server error';
  console.error(err);
  res.status(500).json({ message });
});

export default app;
