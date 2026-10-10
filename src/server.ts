import 'dotenv/config';
import { connectDB } from './config/db.js';
import app from './app.js';

const PORT = Number(process.env.PORT) || 4000;

async function bootstrap(): Promise<void> {
  // Connect to MongoDB before accepting any HTTP traffic
  await connectDB();

  app.listen(PORT, () => {
    console.log(`🚀  Server running on http://localhost:${PORT}`);
  });
}

bootstrap().catch((err: unknown) => {
  console.error('❌  Failed to start server:', err);
  process.exit(1);
});
