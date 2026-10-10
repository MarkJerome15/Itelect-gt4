import { Router, Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { authenticate } from '../middleware/auth.js';
import SessionModel from '../models/Session.js';
import type { CreateSessionInput, UpdateSessionInput } from '../types/index.js';

const router = Router();

// All session routes are protected
router.use(authenticate);

// ── GET /api/sessions ─ list all sessions belonging to the current user ──────
router.get('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const sessions = await SessionModel.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json({ count: sessions.length, sessions });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/sessions/:id ─ get a single session owned by the current user ───
router.get('/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ message: 'Invalid session ID' });
      return;
    }

    const session = await SessionModel.findOne({ _id: req.params.id, userId: req.userId });
    if (!session) {
      res.status(404).json({ message: 'Session not found' });
      return;
    }

    res.json({ session });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/sessions ─ create a new session for the current user ───────────
router.post('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const body = req.body as CreateSessionInput;
    const session = await SessionModel.create({ ...body, userId: req.userId });
    res.status(201).json({ session });
  } catch (err) {
    next(err);
  }
});

// ── PATCH /api/sessions/:id ─ update a session owned by the current user ─────
router.patch('/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ message: 'Invalid session ID' });
      return;
    }

    const body = req.body as UpdateSessionInput;
    const session = await SessionModel.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId }, // strict owner filter
      { $set: body },
      { new: true, runValidators: true }
    );

    if (!session) {
      res.status(404).json({ message: 'Session not found' });
      return;
    }

    res.json({ session });
  } catch (err) {
    next(err);
  }
});

// ── DELETE /api/sessions/:id ─ delete a session owned by the current user ────
router.delete('/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ message: 'Invalid session ID' });
      return;
    }

    const session = await SessionModel.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!session) {
      res.status(404).json({ message: 'Session not found' });
      return;
    }

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
