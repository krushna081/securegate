import mongoose, { Document, Schema } from 'mongoose';

export interface IMeeting extends Document {
  societyId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  date: Date;
  time: string;
  location?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const meetingSchema = new Schema<IMeeting>(
  {
    societyId: { type: Schema.Types.ObjectId, ref: 'Society', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    location: { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

meetingSchema.index({ societyId: 1, date: -1 });

export default mongoose.model<IMeeting>('Meeting', meetingSchema);
