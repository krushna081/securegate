import mongoose, { Document, Schema } from 'mongoose';

export interface ISociety extends Document {
  name: string;
  address: string;
  createdAt: Date;
}

const societySchema = new Schema<ISociety>(
  {
    name: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

export default mongoose.model<ISociety>('Society', societySchema);
