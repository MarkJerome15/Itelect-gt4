import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import UserModel from '../models/User.js';
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

      const user = await UserModel.create({ name, email, password, role });
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
      if (!user) {
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
      const token = jwt.sign(payload, secret, { expiresIn: '2h' });

      res.json({ token, user });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
