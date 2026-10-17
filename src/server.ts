import 'dotenv/config';
import { connectDB } from './config/db.js';
import app from './app.js';

const PORT = Number(process.env.PORT) || 4000;

// Kick off the DB connection (errors are logged, not fatal)
connectDB().catch((err: unknown) => {
  console.error('❌  MongoDB connection error:', err);
});

// Start listening immediately — the per-request middleware in app.ts
// ensures the DB is connected before any route handler runs.
app.listen(PORT, () => {
  console.log(`🚀  Server running on http://localhost:${PORT}`);
});
