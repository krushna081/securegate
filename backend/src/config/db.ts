import mongoose from 'mongoose';

let connected = false;

const connectDB = async () => {
  if (connected) return;
  try {
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/securegate';
    await mongoose.connect(uri);
    connected = true;
    console.log(`MongoDB Connected`);
  } catch (error) {
    console.error('MongoDB Connection Error:', error);
    if (!process.env.VERCEL) process.exit(1);
  }
};

export default connectDB;
