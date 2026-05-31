import mongoose, { Document, Schema } from 'mongoose';

export interface IVisitor extends Document {
  visitorName: string;
  visitorType: string;
  photoUrl?: string;
  phoneNumber?: string;
  societyId: mongoose.Types.ObjectId;
  flatId: mongoose.Types.ObjectId;
  guardId?: mongoose.Types.ObjectId;
  residentId?: mongoose.Types.ObjectId;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
  vehicleNumber?: string;
  createdAt: Date;
}

const visitorSchema = new Schema<IVisitor>(
  {
    visitorName: { type: String, required: true, trim: true },
    visitorType: {
      type: String,
      enum: ['guest', 'delivery', 'maid', 'electrician', 'plumber', 'courier', 'technician', 'driver', 'maintenance'],
      required: true,
    },
    photoUrl: { type: String },
    phoneNumber: { type: String, required: true },
    societyId: { type: Schema.Types.ObjectId, ref: 'Society', required: true },
    flatId: { type: Schema.Types.ObjectId, ref: 'Flat', required: true },
    guardId: { type: Schema.Types.ObjectId, ref: 'User' },
    residentId: { type: Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    notes: { type: String },
    vehicleNumber: { type: String },
  },
  { timestamps: true }
);

visitorSchema.index({ societyId: 1, createdAt: -1 });
visitorSchema.index({ flatId: 1, createdAt: -1 });

export default mongoose.model<IVisitor>('Visitor', visitorSchema);
