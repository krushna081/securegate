import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import Meeting from '../models/Meeting';

export const createMeeting = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, date, time, location } = req.body;

    if (!title || !date || !time) {
      return res.status(400).json({ message: 'Title, date, and time are required' });
    }

    const meeting = await Meeting.create({
      societyId: req.user!.societyId,
      title,
      description,
      date,
      time,
      location,
      createdBy: req.user!._id,
    });

    const populated = await Meeting.findById(meeting._id)
      .populate('createdBy', 'fullName');

    res.status(201).json({ meeting: populated });
  } catch (error) {
    console.error('createMeeting error:', error);
    res.status(500).json({ message: 'Failed to create meeting' });
  }
};

export const getMeetings = async (req: AuthRequest, res: Response) => {
  try {
    const filter: any = { societyId: req.user!.societyId };

    const meetings = await Meeting.find(filter)
      .populate('createdBy', 'fullName')
      .sort({ date: -1 })
      .limit(20);

    res.json({ meetings });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch meetings' });
  }
};

export const deleteMeeting = async (req: AuthRequest, res: Response) => {
  try {
    const meeting = await Meeting.findById(req.params.id);

    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    if (req.user!.role !== 'guard' && req.user!.role !== 'admin') {
      return res.status(403).json({ message: 'Only guards can delete meetings' });
    }

    await Meeting.findByIdAndDelete(req.params.id);
    res.json({ message: 'Meeting deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete meeting' });
  }
};
