import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IVisitorStatusEvent {
  status: 'pending' | 'approved' | 'rejected';
  changedBy: Types.ObjectId;
  changedAt: Date;
}

export interface IVisitor extends Document {
  visitorName: string;
  visitorType: string;
  photoUrl?: string;
  hasPhoto: boolean;
  phoneNumber: string;
  societyId: Types.ObjectId;
  flatId: Types.ObjectId;
  guardId: Types.ObjectId;
  residentId?: Types.ObjectId;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
  vehicleNumber?: string;
  approvedBy?: Types.ObjectId;
  approvedAt?: Date;
  statusHistory: IVisitorStatusEvent[];
  deletedAt?: Date | null;
  deletedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const visitorSchema = new Schema<IVisitor>(
  {
    visitorName: { type: String, required: true, trim: true, maxlength: 80 },
    visitorType: {
      type: String,
      enum: [
        'guest',
        'delivery',
        'maid',
        'electrician',
        'plumber',
        'courier',
        'technician',
        'driver',
        'maintenance',
      ],
      required: true,
    },
    photoUrl: { type: String, maxlength: 1_500_000, select: false },
    hasPhoto: { type: Boolean, default: false, required: true },
    phoneNumber: { type: String, required: true, trim: true, maxlength: 20 },
    societyId: { type: Schema.Types.ObjectId, ref: 'Society', required: true },
    flatId: { type: Schema.Types.ObjectId, ref: 'Flat', required: true },
    guardId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    residentId: { type: Schema.Types.ObjectId, ref: 'User' },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      required: true,
    },
    notes: { type: String, trim: true, maxlength: 500 },
    vehicleNumber: { type: String, trim: true, maxlength: 24 },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    statusHistory: [
      {
        status: {
          type: String,
          enum: ['pending', 'approved', 'rejected'],
          required: true,
        },
        changedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        changedAt: { type: Date, default: Date.now, required: true },
      },
    ],
    deletedAt: { type: Date, default: null },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

visitorSchema.index({ societyId: 1, createdAt: -1 });
visitorSchema.index({ residentId: 1, createdAt: -1 });
visitorSchema.index({ societyId: 1, status: 1, createdAt: -1 });
visitorSchema.index({ deletedAt: 1 });

export default mongoose.model<IVisitor>('Visitor', visitorSchema);
