import mongoose from 'mongoose';

// ─── Model Registrations ───────────────────────────────────────────────────
// Essential for production Serverless environments to ensure population
// targets (refs) are registered BEFORE any queries (populate) run.
import '@/src/models/User';
import '@/src/models/Match';
import '@/src/models/Team';
import '@/src/models/Prediction';

async function dbConnect() {
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    throw new Error(
      'Please define the MONGODB_URI environment variable inside .env.local'
    );
  }

  let cached = (global as any).mongoose;

  if (!cached) {
    cached = (global as any).mongoose = { conn: null, promise: null };
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    console.log('[DB] Connecting to MongoDB...');
    cached.promise = mongoose.connect(MONGODB_URI, opts).then((m) => {
      console.log('[DB] Connected successfully');
      return m;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    console.error('[CRITICAL] Database connection error:', e);
    throw e;
  }

  return cached.conn;
}

export default dbConnect;
