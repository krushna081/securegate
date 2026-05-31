import mongoose, { Document, Schema } from 'mongoose';

export interface IFlat extends Document {
  societyId: mongoose.Types.ObjectId;
  flatNumber: string;
  blockName: string;
  residentId?: mongoose.Types.ObjectId;
  createdAt: Date;
}

const flatSchema = new Schema<IFlat>(
  {
    societyId: { type: Schema.Types.ObjectId, ref: 'Society', required: true },
    flatNumber: { type: String, required: true, trim: true },
    blockName: { type: String, required: true, trim: true },
    residentId: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

flatSchema.index({ societyId: 1, flatNumber: 1, blockName: 1 }, { unique: true });

export default mongoose.model<IFlat>('Flat', flatSchema);
