import { Response } from 'express';
import Meeting from '../models/Meeting';
import { AuthRequest } from '../middleware/authMiddleware';
import { AppError } from '../middleware/errorHandler';
import { tenantFilter, isSuperAdmin } from '../utils/tenant';
import { meetingCreateSchema } from '../validation/schemas';

export const createMeeting = async (req: AuthRequest, res: Response): Promise<void> => {
  const input = meetingCreateSchema.parse(req.body);
  const user = req.user!;

  if (user.role !== 'guard' && user.role !== 'admin') {
    throw new AppError('Only guards and admins can create meetings.', 403);
  }

  const societyId = user.societyId ?? input.societyId;
  if (!societyId) {
    throw new AppError('Choose a society for this meeting.', 400);
  }

  const meeting = await Meeting.create({
    societyId,
    title: input.title,
    description: input.description,
    date: new Date(input.date),
    time: input.time,
    location: input.location,
    createdBy: user._id,
  });

  const populated = await Meeting.findById(meeting._id).populate('createdBy', 'fullName');
  res.status(201).json({ meeting: populated });
};

export const getMeetings = async (req: AuthRequest, res: Response): Promise<void> => {
  const filter = tenantFilter(req.user!);
  const meetings = await Meeting.find(filter)
    .populate('createdBy', 'fullName')
    .sort({ date: -1 })
    .limit(50);

  res.json({ meetings });
};

export const deleteMeeting = async (req: AuthRequest, res: Response): Promise<void> => {
  const user = req.user!;
  if (user.role !== 'guard' && user.role !== 'admin') {
    throw new AppError('Only guards and admins can delete meetings.', 403);
  }

  const meeting = await Meeting.findById(req.params.id);
  if (!meeting) throw new AppError('Meeting not found.', 404);

  if (!isSuperAdmin(user as any) && String(meeting.societyId) !== String(user.societyId)) {
    throw new AppError('Not authorized to delete this meeting.', 403);
  }

  await Meeting.deleteOne({ _id: meeting._id });
  res.json({ message: 'Meeting deleted.' });
};
