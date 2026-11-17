import mongoose, { Document, Schema } from 'mongoose';

export interface ISociety extends Document {
  name: string;
  address: string;
  createdAt: Date;
  updatedAt: Date;
}

const societySchema = new Schema<ISociety>(
  {
    name: { type: String, required: true, trim: true, unique: true, maxlength: 100 },
    address: { type: String, required: true, trim: true, default: '', maxlength: 200 },
  },
  { timestamps: true },
);

export default mongoose.model<ISociety>('Society', societySchema);
