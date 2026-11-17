import mongoose, { Document, Schema } from 'mongoose';

export interface IOtp extends Document {
  email: string;
  purpose: 'auth' | 'profile';
  otpHash: string;
  expiresAt: Date;
  attempts: number;
  sendCount: number;
  windowStart: Date;
  createdAt: Date;
  updatedAt: Date;
}

const otpSchema = new Schema<IOtp>(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    purpose: {
      type: String,
      enum: ['auth', 'profile'],
      required: true,
      default: 'auth',
    },
    otpHash: { type: String, required: true, select: false },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0, required: true },
    sendCount: { type: Number, default: 0, required: true },
    windowStart: { type: Date, default: Date.now, required: true },
  },
  { timestamps: true },
);

otpSchema.index({ email: 1, purpose: 1 }, { unique: true });
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model<IOtp>('Otp', otpSchema);
