import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import UserModel from '../models/User.js';
import { authenticate } from '../middleware/auth.js';
import type { RegisterInput, LoginInput, JwtPayload } from '../types/index.js';

const router = Router();

// ── POST /api/auth/register ──────────────────────────────────────────────────
router.post(
  '/register',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { name, email, password, role } = req.body as RegisterInput;

      const existing = await UserModel.findOne({ email });
      if (existing) {
        res.status(409).json({ message: 'Email already in use' });
        return;
      }

      // Default role to 'tutee' if not provided or valid
      const userRole = role && ['tutor', 'tutee', 'user', 'admin'].includes(role) ? role : 'tutee';
      const user = await UserModel.create({ name, email, password, role: userRole });
      res.status(201).json({ message: 'User registered successfully', user });
    } catch (err) {
      next(err);
    }
  }
);

// ── POST /api/auth/login ─────────────────────────────────────────────────────
router.post(
  '/login',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password } = req.body as LoginInput;

      // Explicitly select password back (it is select:false on schema)
      const user = await UserModel.findOne({ email }).select('+password');
      if (!user || !user.password) {
        res.status(401).json({ message: 'Invalid credentials' });
        return;
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        res.status(401).json({ message: 'Invalid credentials' });
        return;
      }

      const secret = process.env.JWT_SECRET;
      if (!secret) throw new Error('JWT_SECRET is not configured');

      const payload: JwtPayload = { userId: user._id.toString() };
      const token = jwt.sign(payload, secret, { expiresIn: '7d' });

      res.json({ token, user });
    } catch (err) {
      next(err);
    }
  }
);

// ── GET /api/auth/me ─ get current authenticated user ────────────────────────
router.get(
  '/me',
  authenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await UserModel.findById(req.userId);
      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }
      res.json({ user });
    } catch (err) {
      next(err);
    }
  }
);

// ── GET /api/auth/tutors ─ get all registered tutors ─────────────────────────
router.get(
  '/tutors',
  async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tutors = await UserModel.find({ role: 'tutor' }).select('name email role createdAt');
      res.json({ count: tutors.length, tutors });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
