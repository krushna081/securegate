import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import Visitor from '../models/Visitor';
import Flat from '../models/Flat';
import Notification from '../models/Notification';
import { notifyResidentAboutVisitor } from '../services/pushService';

export const createVisitor = async (req: AuthRequest, res: Response) => {
  try {
    const { visitorName, visitorType, photoUrl, phoneNumber, flatId, notes, vehicleNumber } = req.body;

    const flat = await Flat.findById(flatId).populate('residentId');
    if (!flat) {
      return res.status(404).json({ message: 'Flat not found' });
    }

    const visitor = await Visitor.create({
      visitorName,
      visitorType,
      photoUrl,
      phoneNumber,
      societyId: req.user!.societyId || flat.societyId,
      flatId,
      guardId: req.user!._id,
      residentId: flat.residentId?._id,
      notes,
      vehicleNumber,
    });

    const populated = await Visitor.findById(visitor._id)
      .populate('flatId', 'flatNumber blockName')
      .populate('guardId', 'fullName email phoneNumber')
      .populate('residentId', 'fullName email phoneNumber');

    try {
      if (flat.residentId) {
        const notification = await Notification.create({
          userId: flat.residentId._id,
          title: 'New Visitor',
          body: `${visitorName} is at the gate — Flat ${flat.flatNumber}`,
          data: { type: 'visitor-approval', visitorId: populated!._id.toString() },
        });

        try {
          await notifyResidentAboutVisitor(
            flat.residentId._id.toString(),
            visitorName,
            populated!._id.toString(),
            flat.flatNumber,
            photoUrl,
          );
        } catch {}
      }
    } catch {}

    res.status(201).json({ visitor: populated });
  } catch (error) {
    console.error('createVisitor error:', error);
    res.status(500).json({ message: 'Failed to register visitor' });
  }
};

export const getVisitors = async (req: AuthRequest, res: Response) => {
  try {
    const { status, flatId, scope } = req.query;
    const filter: any = {};

    if (req.user!.role === 'guard') {
      filter.societyId = req.user!.societyId;
    } else if (req.user!.role === 'resident') {
      if (scope === 'society') {
        filter.societyId = req.user!.societyId;
      } else {
        filter.residentId = req.user!._id;
      }
    } else if (req.user!.role === 'admin' && req.user!.societyId) {
      filter.societyId = req.user!.societyId;
    }

    if (status) filter.status = status;
    if (flatId) filter.flatId = flatId;

    const visitors = await Visitor.find(filter)
      .populate('flatId', 'flatNumber blockName')
      .populate('guardId', 'fullName email phoneNumber')
      .populate('residentId', 'fullName email phoneNumber')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ visitors });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch visitors' });
  }
};

export const getVisitorById = async (req: AuthRequest, res: Response) => {
  try {
    const visitor = await Visitor.findById(req.params.id)
      .populate('flatId', 'flatNumber blockName')
      .populate('guardId', 'fullName email phoneNumber')
      .populate('residentId', 'fullName email');

    if (!visitor) {
      return res.status(404).json({ message: 'Visitor not found' });
    }

    res.json({ visitor });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch visitor' });
  }
};

export const updateVisitorStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const visitor = await Visitor.findByIdAndUpdate(id, { status }, { new: true })
      .populate('flatId', 'flatNumber blockName')
      .populate('guardId', 'fullName email phoneNumber')
      .populate('residentId', 'fullName email phoneNumber');

    if (!visitor) {
      return res.status(404).json({ message: 'Visitor not found' });
    }

    res.json({ visitor });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update status' });
  }
};

export const deleteVisitor = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id || id.length < 12) {
      return res.status(400).json({ message: 'Invalid visitor ID' });
    }
    const visitor = await Visitor.findByIdAndDelete(id);
    if (!visitor) {
      return res.status(404).json({ message: 'Visitor not found' });
    }
    res.json({ message: 'Visitor deleted' });
  } catch (error) {
    console.error('deleteVisitor error:', error);
    res.status(500).json({ message: 'Failed to delete visitor' });
  }
};

export const updateVisitor = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { visitorName, visitorType, phoneNumber, flatId, notes, vehicleNumber } = req.body;

    const updateData: any = {};
    if (visitorName !== undefined) updateData.visitorName = visitorName;
    if (visitorType !== undefined) updateData.visitorType = visitorType;
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
    if (flatId !== undefined) updateData.flatId = flatId;
    if (notes !== undefined) updateData.notes = notes;
    if (vehicleNumber !== undefined) updateData.vehicleNumber = vehicleNumber;

    const visitor = await Visitor.findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
      .populate('flatId', 'flatNumber blockName')
      .populate('guardId', 'fullName email phoneNumber')
      .populate('residentId', 'fullName email phoneNumber');

    if (!visitor) {
      return res.status(404).json({ message: 'Visitor not found' });
    }

    res.json({ visitor });
  } catch (error) {
    console.error('updateVisitor error:', error);
    res.status(500).json({ message: 'Failed to update visitor' });
  }
};
