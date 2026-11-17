import mongoose from 'mongoose';
import { env } from './env';

let cachedConnection: typeof mongoose | null = null;
let connectionPromise: Promise<typeof mongoose> | null = null;

const connectDB = async (): Promise<typeof mongoose> => {
  if (cachedConnection) return cachedConnection;
  if (connectionPromise) return connectionPromise;

  mongoose.set('sanitizeFilter', true);
  mongoose.set('strictQuery', true);

  connectionPromise = mongoose
    .connect(env.mongoUri, {
      serverSelectionTimeoutMS: 10000,
    })
    .then((connection) => {
      cachedConnection = connection;
      console.log('MongoDB connected');
      return connection;
    })
    .catch((error) => {
      connectionPromise = null;
      console.error('MongoDB connection error:', error instanceof Error ? error.message : error);
      if (!process.env.VERCEL) process.exit(1);
      throw error;
    });

  return connectionPromise;
};

export default connectDB;
