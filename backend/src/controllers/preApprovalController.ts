import { Response } from 'express';
import PreApproval from '../models/PreApproval';
import Flat from '../models/Flat';
import { AuthRequest } from '../middleware/authMiddleware';
import { AppError } from '../middleware/errorHandler';
import { isSuperAdmin, tenantFilter } from '../utils/tenant';
import {
  preApprovalCreateSchema,
  preApprovalStatusSchema,
  preApprovalUpdateSchema,
} from '../validation/schemas';

const PRE_APPROVAL_POPULATE = [
  { path: 'flatId', select: 'flatNumber blockName' },
  { path: 'residentId', select: 'fullName email phoneNumber' },
];

function sameSociety(user: AuthRequest['user'], societyId: unknown): boolean {
  if (!user || !user.societyId || !societyId) return false;
  return String(user.societyId) === String(societyId);
}

function canAccessPreApproval(user: AuthRequest['user'], preApproval: any): boolean {
  if (!user) return false;
  if (user.role === 'resident') {
    return String(preApproval.residentId?._id ?? preApproval.residentId) === String(user._id);
  }
  if (user.role === 'admin') {
    return isSuperAdmin(user as any) || sameSociety(user, preApproval.societyId);
  }
  if (user.role === 'guard') {
    return sameSociety(user, preApproval.societyId);
  }
  return false;
}

export const createPreApproval = async (req: AuthRequest, res: Response): Promise<void> => {
  const input = preApprovalCreateSchema.parse(req.body);
  const user = req.user!;

  if (user.role !== 'resident') {
    throw new AppError('Only residents can pre-approve visitors.', 403);
  }

  if (!user.flatId || !user.societyId) {
    throw new AppError('No flat is assigned to your account.', 400);
  }

  const flat = await Flat.findById(user.flatId).select('societyId flatNumber blockName');
  if (!flat) throw new AppError('No flat is assigned to your account.', 400);

  const preApproval = await PreApproval.create({
    residentId: user._id,
    flatId: flat._id,
    societyId: flat.societyId,
    guestName: input.guestName,
    numberOfPeople: input.numberOfPeople,
    vehicleType: input.vehicleType,
    vehicleNumber: input.vehicleNumber,
    expectedTime: input.expectedTime ? new Date(input.expectedTime) : undefined,
    notes: input.notes,
    status: 'expected',
  });

  const populated = await PreApproval.findById(preApproval._id).populate(PRE_APPROVAL_POPULATE);
  res.status(201).json({ preApproval: populated });
};

export const getMyPreApprovals = async (req: AuthRequest, res: Response): Promise<void> => {
  const preApprovals = await PreApproval.find({ residentId: req.user!._id })
    .populate(PRE_APPROVAL_POPULATE)
    .sort({ createdAt: -1 })
    .limit(100);

  res.json({ preApprovals });
};

export const getAllPreApprovalsBySociety = async (req: AuthRequest, res: Response): Promise<void> => {
  const filter = tenantFilter(req.user!);
  const preApprovals = await PreApproval.find(filter)
    .populate(PRE_APPROVAL_POPULATE)
    .sort({ expectedTime: 1, createdAt: -1 })
    .limit(200);

  res.json({ preApprovals });
};

export const updatePreApproval = async (req: AuthRequest, res: Response): Promise<void> => {
  const input = preApprovalUpdateSchema.parse(req.body);
  const preApproval = await PreApproval.findById(req.params.id).populate(PRE_APPROVAL_POPULATE);

  if (!preApproval) throw new AppError('Pre-approval not found.', 404);
  if (!canAccessPreApproval(req.user!, preApproval)) throw new AppError('Not authorized.', 403);

  if (
    req.user!.role === 'resident' &&
    String(preApproval.residentId?._id ?? preApproval.residentId) !== String(req.user!._id)
  ) {
    throw new AppError('Not authorized to edit this pre-approval.', 403);
  }

  if (req.user!.role === 'guard') {
    throw new AppError('Guards cannot edit pre-approvals.', 403);
  }

  if (input.guestName !== undefined) preApproval.guestName = input.guestName;
  if (input.numberOfPeople !== undefined) preApproval.numberOfPeople = input.numberOfPeople;
  if (input.vehicleType !== undefined) preApproval.vehicleType = input.vehicleType;
  if (input.vehicleNumber !== undefined) preApproval.vehicleNumber = input.vehicleNumber;
  if (input.expectedTime !== undefined) {
    preApproval.expectedTime = new Date(input.expectedTime);
  }
  if (input.notes !== undefined) preApproval.notes = input.notes;

  await preApproval.save();
  const populated = await PreApproval.findById(preApproval._id).populate(PRE_APPROVAL_POPULATE);
  res.json({ preApproval: populated });
};

export const updatePreApprovalStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  const { status } = preApprovalStatusSchema.parse(req.body);
  const preApproval = await PreApproval.findById(req.params.id).populate(PRE_APPROVAL_POPULATE);

  if (!preApproval) throw new AppError('Pre-approval not found.', 404);
  if (!canAccessPreApproval(req.user!, preApproval)) throw new AppError('Not authorized.', 403);

  if (
    req.user!.role === 'resident' &&
    String(preApproval.residentId?._id ?? preApproval.residentId) !== String(req.user!._id)
  ) {
    throw new AppError('Not authorized.', 403);
  }

  preApproval.status = status;
  await preApproval.save();

  const populated = await PreApproval.findById(preApproval._id).populate(PRE_APPROVAL_POPULATE);
  res.json({ preApproval: populated });
};

export const deletePreApproval = async (req: AuthRequest, res: Response): Promise<void> => {
  const preApproval = await PreApproval.findById(req.params.id);

  if (!preApproval) throw new AppError('Pre-approval not found.', 404);
  if (!canAccessPreApproval(req.user!, preApproval)) throw new AppError('Not authorized.', 403);

  if (req.user!.role === 'guard') {
    throw new AppError('Guards cannot delete pre-approvals.', 403);
  }

  if (
    req.user!.role === 'resident' &&
    String(preApproval.residentId) !== String(req.user!._id)
  ) {
    throw new AppError('Not authorized to delete this pre-approval.', 403);
  }

  await PreApproval.deleteOne({ _id: preApproval._id });
  res.json({ message: 'Pre-approval deleted.' });
};
