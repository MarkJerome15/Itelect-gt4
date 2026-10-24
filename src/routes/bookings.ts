import { Router, Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { authenticate } from '../middleware/auth.js';
import BookingModel from '../models/Booking.js';
import SessionModel from '../models/Session.js';
import type { CreateBookingInput, UpdateBookingStatusInput } from '../types/index.js';

const router = Router();

// All booking routes require authentication
router.use(authenticate);

// ── GET /api/bookings ─ list bookings for current user (tutee or tutor) ─────
router.get('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status, role } = req.query;

    const filter: Record<string, unknown> = {};

    if (role === 'tutor') {
      filter.tutorId = req.userId;
    } else if (role === 'tutee') {
      filter.tuteeId = req.userId;
    } else {
      filter.$or = [{ tuteeId: req.userId }, { tutorId: req.userId }];
    }

    if (status && typeof status === 'string' && status !== 'all') {
      filter.status = status;
    }

    const bookings = await BookingModel.find(filter)
      .populate('sessionId', 'title subject ratePerHour durationMinutes status')
      .populate('tuteeId', 'name email role')
      .populate('tutorId', 'name email role')
      .sort({ scheduledAt: -1, createdAt: -1 });

    res.json({ count: bookings.length, bookings });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/bookings/:id ─ get a single booking ─────────────────────────────
router.get('/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ message: 'Invalid booking ID' });
      return;
    }

    const booking = await BookingModel.findOne({
      _id: req.params.id,
      $or: [{ tuteeId: req.userId }, { tutorId: req.userId }],
    })
      .populate('sessionId')
      .populate('tuteeId', 'name email role')
      .populate('tutorId', 'name email role');

    if (!booking) {
      res.status(404).json({ message: 'Booking not found' });
      return;
    }

    res.json({ booking });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/bookings ─ create a new booking (tutee books a session) ─────────
router.post('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { sessionId, scheduledAt, notes } = req.body as CreateBookingInput;

    if (!sessionId || !Types.ObjectId.isValid(sessionId)) {
      res.status(400).json({ message: 'Valid sessionId is required' });
      return;
    }

    const session = await SessionModel.findById(sessionId);
    if (!session) {
      res.status(404).json({ message: 'Tutoring session not found' });
      return;
    }

    const tutorId = session.tutorId || session.userId;
    if (tutorId.toString() === req.userId) {
      res.status(400).json({ message: 'You cannot book your own tutoring session' });
      return;
    }

    const booking = await BookingModel.create({
      sessionId,
      tuteeId: req.userId,
      tutorId,
      status: 'requested',
      scheduledAt: scheduledAt ? new Date(scheduledAt) : new Date(),
      notes: notes || '',
    });

    await booking.populate([
      { path: 'sessionId', select: 'title subject ratePerHour durationMinutes' },
      { path: 'tuteeId', select: 'name email role' },
      { path: 'tutorId', select: 'name email role' },
    ]);

    res.status(201).json({ booking });
  } catch (err) {
    next(err);
  }
});

// ── PATCH /api/bookings/:id ─ update booking status (confirm, complete, cancel)
router.patch('/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ message: 'Invalid booking ID' });
      return;
    }

    const { status, notes } = req.body as UpdateBookingStatusInput;

    const allowed = ['requested', 'confirmed', 'completed', 'cancelled'];
    if (status && !allowed.includes(status)) {
      res.status(400).json({ message: `Status must be one of: ${allowed.join(', ')}` });
      return;
    }

    const updateFields: Record<string, unknown> = {};
    if (status) updateFields.status = status;
    if (typeof notes === 'string') updateFields.notes = notes;

    const booking = await BookingModel.findOneAndUpdate(
      {
        _id: req.params.id,
        $or: [{ tuteeId: req.userId }, { tutorId: req.userId }],
      },
      { $set: updateFields },
      { new: true, runValidators: true }
    )
      .populate('sessionId', 'title subject ratePerHour durationMinutes')
      .populate('tuteeId', 'name email role')
      .populate('tutorId', 'name email role');

    if (!booking) {
      res.status(404).json({ message: 'Booking not found or not authorized' });
      return;
    }

    res.json({ booking });
  } catch (err) {
    next(err);
  }
});

// ── DELETE /api/bookings/:id ─ cancel / delete booking ────────────────────────
router.delete('/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ message: 'Invalid booking ID' });
      return;
    }

    const booking = await BookingModel.findOneAndDelete({
      _id: req.params.id,
      $or: [{ tuteeId: req.userId }, { tutorId: req.userId }],
    });

    if (!booking) {
      res.status(404).json({ message: 'Booking not found or not authorized' });
      return;
    }

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
