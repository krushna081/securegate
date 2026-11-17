import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IPreApproval extends Document {
  residentId: Types.ObjectId;
  flatId: Types.ObjectId;
  societyId: Types.ObjectId;
  guestName: string;
  numberOfPeople?: number;
  vehicleType?: 'none' | '2-wheeler' | '4-wheeler';
  vehicleNumber?: string;
  expectedTime?: Date;
  notes?: string;
  status: 'expected' | 'approved' | 'arrived';
  createdAt: Date;
  updatedAt: Date;
}

const preApprovalSchema = new Schema<IPreApproval>(
  {
    residentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    flatId: { type: Schema.Types.ObjectId, ref: 'Flat', required: true },
    societyId: { type: Schema.Types.ObjectId, ref: 'Society', required: true },
    guestName: { type: String, required: true, trim: true, maxlength: 80 },
    numberOfPeople: { type: Number, min: 1, max: 20, default: 1 },
    vehicleType: {
      type: String,
      enum: ['none', '2-wheeler', '4-wheeler'],
      default: 'none',
    },
    vehicleNumber: { type: String, trim: true, maxlength: 24 },
    expectedTime: { type: Date },
    notes: { type: String, trim: true, maxlength: 500 },
    status: {
      type: String,
      enum: ['expected', 'approved', 'arrived'],
      default: 'expected',
    },
  },
  { timestamps: true },
);

preApprovalSchema.index({ societyId: 1, expectedTime: 1 });
preApprovalSchema.index({ residentId: 1, createdAt: -1 });

export default mongoose.model<IPreApproval>('PreApproval', preApprovalSchema);
