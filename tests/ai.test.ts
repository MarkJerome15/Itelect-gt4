import { describe, it, expect, vi, beforeAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../src/app.js';

// Set a fallback JWT_SECRET if not already in environment
beforeAll(() => {
  if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = 'test-secret-key-12345';
  }
});

// Mock the DB so no real connection is needed
vi.mock('../src/config/db.js', () => ({
  connectDB: async () => {},
}));

// Helper: sign a token the same way the auth route does
function tokenFor(userId: string): string {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'test-secret-key-12345', { expiresIn: '5m' });
}

describe('POST /api/ai', () => {
  it('answers 401 when there is no token', async () => {
    const res = await request(app)
      .post('/api/ai')
      .send({ prompt: 'A course submission tracker in React.' });
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Unauthorized: no token provided');
  });

  it('answers 401 when the token was signed with another secret', async () => {
    const forged = jwt.sign({ userId: 'someone' }, 'not-the-secret');
    const res = await request(app)
      .post('/api/ai')
      .set('Authorization', `Bearer ${forged}`)
      .send({ prompt: 'A course submission tracker in React.' });
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Unauthorized: invalid or expired token');
  });

  it('lets a valid token through, then checks the body', async () => {
    const res = await request(app)
      .post('/api/ai')
      .set('Authorization', `Bearer ${tokenFor('test-user')}`)
      .send({ prompt: 'Too short' }); // too short (< 20 chars) -> schema rejects it without calling Gemini
    expect(res.status).toBe(400);
    expect(res.body.errors).toEqual([
      'Describe your project in at least 20 characters.',
    ]);
  });
});
