import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IFlat extends Document {
  societyId: Types.ObjectId;
  flatNumber: string;
  blockName: string;
  residentId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const flatSchema = new Schema<IFlat>(
  {
    societyId: { type: Schema.Types.ObjectId, ref: 'Society', required: true },
    flatNumber: { type: String, required: true, trim: true, maxlength: 20 },
    blockName: { type: String, required: true, trim: true, maxlength: 20 },
    residentId: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

flatSchema.index({ societyId: 1, blockName: 1, flatNumber: 1 }, { unique: true });
flatSchema.index({ residentId: 1 });

export default mongoose.model<IFlat>('Flat', flatSchema);
