import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import PreApproval from '../models/PreApproval';
import Flat from '../models/Flat';

export const createPreApproval = async (req: AuthRequest, res: Response) => {
  try {
    const { guestName, numberOfPeople, vehicleType, vehicleNumber, expectedTime, notes } = req.body;

    if (req.user!.role !== 'resident') {
      return res.status(403).json({ message: 'Only residents can pre-approve visitors' });
    }

    const flat = await Flat.findById(req.user!.flatId);
    if (!flat) {
      return res.status(400).json({ message: 'No flat assigned to your account' });
    }

    const preApproval = await PreApproval.create({
      residentId: req.user!._id,
      flatId: req.user!.flatId,
      guestName,
      numberOfPeople: numberOfPeople || 1,
      vehicleType: vehicleType || 'none',
      vehicleNumber,
      expectedTime: expectedTime ? new Date(expectedTime) : undefined,
      notes,
    });

    const populated = await PreApproval.findById(preApproval._id)
      .populate('flatId', 'flatNumber blockName')
      .populate('residentId', 'fullName email phoneNumber');

    res.status(201).json({ preApproval: populated });
  } catch (error) {
    console.error('createPreApproval error:', error);
    res.status(500).json({ message: 'Failed to create pre-approval' });
  }
};

export const getMyPreApprovals = async (req: AuthRequest, res: Response) => {
  try {
    const preApprovals = await PreApproval.find({ residentId: req.user!._id })
      .populate('flatId', 'flatNumber blockName')
      .populate('residentId', 'fullName email phoneNumber')
      .sort({ createdAt: -1 });

    res.json({ preApprovals });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch pre-approvals' });
  }
};

export const getAllPreApprovalsBySociety = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user!.societyId) {
      return res.status(400).json({ message: 'No society assigned' });
    }

    const flats = await Flat.find({ societyId: req.user!.societyId }).select('_id');
    const flatIds = flats.map((f) => f._id);

    const preApprovals = await PreApproval.find({ flatId: { $in: flatIds } })
      .populate('flatId', 'flatNumber blockName')
      .populate('residentId', 'fullName email phoneNumber')
      .sort({ expectedTime: 1 });

    res.json({ preApprovals });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch pre-approvals' });
  }
};

export const updatePreApproval = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { guestName, numberOfPeople, vehicleType, vehicleNumber, expectedTime, notes } = req.body;

    const preApproval = await PreApproval.findById(id);
    if (!preApproval) {
      return res.status(404).json({ message: 'Pre-approval not found' });
    }

    if (preApproval.residentId.toString() !== req.user!._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to edit this pre-approval' });
    }

    const updates: any = {};
    if (guestName !== undefined) updates.guestName = guestName;
    if (numberOfPeople !== undefined) updates.numberOfPeople = numberOfPeople;
    if (vehicleType !== undefined) updates.vehicleType = vehicleType;
    if (vehicleNumber !== undefined) updates.vehicleNumber = vehicleNumber;
    if (expectedTime !== undefined) updates.expectedTime = new Date(expectedTime);
    if (notes !== undefined) updates.notes = notes;

    const updated = await PreApproval.findByIdAndUpdate(id, updates, { new: true, runValidators: true })
      .populate('flatId', 'flatNumber blockName')
      .populate('residentId', 'fullName email phoneNumber');

    res.json({ preApproval: updated });
  } catch (error) {
    console.error('updatePreApproval error:', error);
    res.status(500).json({ message: 'Failed to update pre-approval' });
  }
};

export const updatePreApprovalStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['expected', 'approved', 'arrived'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const existing = await PreApproval.findById(id);
    if (!existing) {
      return res.status(404).json({ message: 'Pre-approval not found' });
    }

    if (req.user!.role === 'resident' && existing.residentId.toString() !== req.user!._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const preApproval = await PreApproval.findByIdAndUpdate(id, { status }, { new: true })
      .populate('flatId', 'flatNumber blockName')
      .populate('residentId', 'fullName email phoneNumber');

    res.json({ preApproval });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update status' });
  }
};

export const deletePreApproval = async (req: AuthRequest, res: Response) => {
  try {
    const preApproval = await PreApproval.findById(req.params.id);

    if (!preApproval) {
      return res.status(404).json({ message: 'Pre-approval not found' });
    }

    if (preApproval.residentId.toString() !== req.user!._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this pre-approval' });
    }

    await PreApproval.findByIdAndDelete(req.params.id);
    res.json({ message: 'Pre-approval deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete pre-approval' });
  }
};
