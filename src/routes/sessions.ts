import { Router, Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { authenticate } from '../middleware/auth.js';
import SessionModel from '../models/Session.js';
import UserModel from '../models/User.js';
import type { CreateSessionInput, UpdateSessionInput } from '../types/index.js';

const router = Router();

// All session routes are protected
router.use(authenticate);

// ── GET /api/sessions ─ list tutoring sessions ───────────────────────────────
// Tutees browse all tutoring sessions; tutors can also pass ?mine=true to view theirs
router.get('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { mine, subject, status, search } = req.query;

    const filter: Record<string, unknown> = {};

    if (mine === 'true') {
      filter.$or = [{ userId: req.userId }, { tutorId: req.userId }];
    }

    if (subject && typeof subject === 'string' && subject !== 'all') {
      filter.subject = new RegExp(`^${subject}$`, 'i');
    }

    if (status && typeof status === 'string' && status !== 'all') {
      filter.status = status;
    }

    if (search && typeof search === 'string' && search.trim()) {
      const term = search.trim();
      filter.$or = [
        { title: new RegExp(term, 'i') },
        { subject: new RegExp(term, 'i') },
        { description: new RegExp(term, 'i') },
      ];
    }

    const sessions = await SessionModel.find(filter)
      .populate('userId', 'name email role')
      .populate('tutorId', 'name email role')
      .sort({ createdAt: -1 });

    res.json({ count: sessions.length, sessions });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/sessions/:id ─ get a single tutoring session ─────────────────────
router.get('/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ message: 'Invalid session ID' });
      return;
    }

    const session = await SessionModel.findById(req.params.id)
      .populate('userId', 'name email role')
      .populate('tutorId', 'name email role');

    if (!session) {
      res.status(404).json({ message: 'Tutoring session not found' });
      return;
    }

    res.json({ session });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/sessions ─ create a new tutoring session ───────────────────────
router.post('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const body = req.body as CreateSessionInput;
    const session = await SessionModel.create({
      ...body,
      userId: req.userId,
      tutorId: req.userId,
    });
    
    await session.populate('userId', 'name email role');

    res.status(201).json({ session });
  } catch (err) {
    next(err);
  }
});

// ── PATCH /api/sessions/:id ─ update session owned by current user ───────────
router.patch('/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ message: 'Invalid session ID' });
      return;
    }

    const body = req.body as UpdateSessionInput;
    const session = await SessionModel.findOneAndUpdate(
      { _id: req.params.id, $or: [{ userId: req.userId }, { tutorId: req.userId }] },
      { $set: body },
      { new: true, runValidators: true }
    ).populate('userId', 'name email role');

    if (!session) {
      res.status(404).json({ message: 'Session not found or not authorized to edit' });
      return;
    }

    res.json({ session });
  } catch (err) {
    next(err);
  }
});

// ── DELETE /api/sessions/:id ─ delete session owned by current user ──────────
router.delete('/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ message: 'Invalid session ID' });
      return;
    }

    const session = await SessionModel.findOneAndDelete({
      _id: req.params.id,
      $or: [{ userId: req.userId }, { tutorId: req.userId }],
    });

    if (!session) {
      res.status(404).json({ message: 'Session not found or not authorized to delete' });
      return;
    }

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
