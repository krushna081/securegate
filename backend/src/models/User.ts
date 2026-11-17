import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IUser extends Document {
  _id: Types.ObjectId;
  email: string;
  fullName: string;
  phoneNumber: string;
  phoneNumber2?: string;
  photoUrl?: string;
  role: 'guard' | 'resident' | 'admin';
  societyId?: Types.ObjectId;
  flatId?: Types.ObjectId;
  gateNumber?: string;
  pushToken?: string;
  tokenVersion: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },
    fullName: { type: String, required: true, trim: true, maxlength: 80 },
    phoneNumber: { type: String, required: true, trim: true, maxlength: 20 },
    phoneNumber2: { type: String, trim: true, maxlength: 20 },
    photoUrl: { type: String, maxlength: 1_500_000 },
    role: {
      type: String,
      enum: ['guard', 'resident', 'admin'],
      required: true,
      default: 'resident',
    },
    societyId: { type: Schema.Types.ObjectId, ref: 'Society', index: true },
    flatId: { type: Schema.Types.ObjectId, ref: 'Flat' },
    gateNumber: { type: String, trim: true, maxlength: 40 },
    pushToken: { type: String, maxlength: 200 },
    tokenVersion: { type: Number, default: 0, required: true },
    isActive: { type: Boolean, default: true, required: true },
  },
  { timestamps: true },
);

userSchema.index({ societyId: 1, role: 1 });

export default mongoose.model<IUser>('User', userSchema);
