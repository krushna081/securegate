import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  email: string;
  fullName: string;
  phoneNumber: string;
  phoneNumber2?: string;
  photoUrl?: string;
  role: 'guard' | 'resident' | 'admin';
  societyId?: mongoose.Types.ObjectId;
  flatId?: mongoose.Types.ObjectId;
  gateNumber?: string;
  pushToken?: string;
  createdAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    fullName: { type: String, required: true, trim: true },
    phoneNumber: { type: String, required: true, trim: true },
    phoneNumber2: { type: String, trim: true },
    photoUrl: { type: String },
    role: { type: String, enum: ['guard', 'resident', 'admin'], required: true },
    societyId: { type: Schema.Types.ObjectId, ref: 'Society' },
    flatId: { type: Schema.Types.ObjectId, ref: 'Flat' },
    gateNumber: { type: String, trim: true },
    pushToken: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<IUser>('User', userSchema);
