// src/routes/ai.ts
import { Router, type Request, type Response } from 'express';
import { rateLimit } from 'express-rate-limit';
import { ApiError } from '@google/genai';
import { requireAuth } from '../middleware/auth.js';
import { aiRequestSchema } from '../schemas/review.js';
import { reviewProject, AiReplyError } from '../ai/gemini.js';

export const aiRouter = Router();

// Private: Every call spends your Gemini quota, so
// an anonymous visitor must not be able to make one.
aiRouter.use(requireAuth);

// Five requests a minute per account. It sits below requireAuth, so
// req.userId exists by the time the limiter reads it -- and the limit
// follows the account, not the network the request came from.
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 5,
  keyGenerator: (req: Request) => req.userId!,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    message: 'Five reviews a minute is the limit. Try again shortly.',
  },
});

aiRouter.use(aiLimiter);

// POST /api/ai
aiRouter.post('/', async (req: Request, res: Response) => {
  // safeParse, not parse: returns errors without throwing
  const parsed = aiRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      message: 'Validation failed',
      errors: parsed.error.issues.map((issue) => issue.message),
    });
    return;
  }

  try {
    const review = await reviewProject(parsed.data.prompt);
    res.json(review);
  } catch (err) {
    // 429 from Gemini means the quota of the Google project behind
    // GEMINI_API_KEY is used up -- not this API's own limit above.
    if (err instanceof ApiError && err.status === 429) {
      res.status(429).json({
        message: 'The AI quota is used up for now. Try again later.',
      });
      return;
    }

    // Gemini refused, failed, or answered with something unusable.
    // Log the real reason; the browser gets a friendly sentence and none of Google's error text.
    if (err instanceof ApiError || err instanceof AiReplyError) {
      console.error(err);
      res.status(502).json({
        message: 'The AI service did not answer properly. Try again.',
      });
      return;
    }

    // Anything else is rethrown to global error handler in app.ts
    throw err;
  }
});

export default aiRouter;
