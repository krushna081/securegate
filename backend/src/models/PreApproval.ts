import mongoose, { Document, Schema } from 'mongoose';

export interface IPreApproval extends Document {
  residentId: mongoose.Types.ObjectId;
  flatId: mongoose.Types.ObjectId;
  guestName: string;
  numberOfPeople?: number;
  vehicleType?: 'none' | '2-wheeler' | '4-wheeler';
  vehicleNumber?: string;
  expectedTime?: Date;
  notes?: string;
  status: 'expected' | 'approved' | 'arrived';
  createdAt: Date;
}

const preApprovalSchema = new Schema<IPreApproval>(
  {
    residentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    flatId: { type: Schema.Types.ObjectId, ref: 'Flat', required: true },
    guestName: { type: String, required: true, trim: true },
    numberOfPeople: { type: Number, min: 1 },
    vehicleType: { type: String, enum: ['none', '2-wheeler', '4-wheeler'], default: 'none' },
    vehicleNumber: { type: String },
    expectedTime: { type: Date },
    notes: { type: String },
    status: { type: String, enum: ['expected', 'approved', 'arrived'], default: 'expected' },
  },
  { timestamps: true }
);

export default mongoose.model<IPreApproval>('PreApproval', preApprovalSchema);
