import mongoose from 'mongoose';

let connection: Promise<typeof mongoose> | null = null;

export function connectDB(): Promise<typeof mongoose> {
  if (connection === null) {
    const uri = process.env.MONGO_URI;
    if (!uri) {
      throw new Error('MONGO_URI environment variable is not set');
    }

    connection = mongoose.connect(uri)
      .then((m) => {
        console.log(`✅  MongoDB connected: ${m.connection.host}`);
        return m;
      })
      .catch((err) => {
        connection = null;
        throw err;
      });
  }

  return connection;
}
