import { Response } from 'express';
import { Types } from 'mongoose';
import Visitor from '../models/Visitor';
import Flat from '../models/Flat';
import Notification from '../models/Notification';
import { AuthRequest } from '../middleware/authMiddleware';
import { AppError } from '../middleware/errorHandler';
import { parseQuery } from '../middleware/validate';
import { tenantFilter, visitorAccessFilter } from '../utils/tenant';
import { notifyResidentAboutVisitor } from '../services/pushService';
import {
  visitorCreateSchema,
  visitorQuerySchema,
  visitorStatusSchema,
  visitorUpdateSchema,
} from '../validation/schemas';

const VISITOR_POPULATE = [
  { path: 'flatId', select: 'flatNumber blockName' },
  { path: 'guardId', select: 'fullName email phoneNumber' },
  { path: 'residentId', select: 'fullName email phoneNumber' },
];

export const createVisitor = async (req: AuthRequest, res: Response): Promise<void> => {
  const input = visitorCreateSchema.parse(req.body);

  const flat = await Flat.findOne({
    _id: input.flatId,
    ...tenantFilter(req.user!),
  }).populate('residentId', 'fullName email phoneNumber');

  if (!flat) throw new AppError('Flat not found.', 404);

  const visitor = await Visitor.create({
    visitorName: input.visitorName,
    visitorType: input.visitorType,
    photoUrl: input.photoUrl,
    hasPhoto: Boolean(input.photoUrl),
    phoneNumber: input.phoneNumber,
    societyId: flat.societyId,
    flatId: flat._id,
    guardId: req.user!._id,
    residentId: flat.residentId?._id,
    notes: input.notes,
    vehicleNumber: input.vehicleNumber,
    status: 'pending',
    statusHistory: [
      {
        status: 'pending',
        changedBy: req.user!._id,
        changedAt: new Date(),
      },
    ],
  });

  const populated = await Visitor.findById(visitor._id).populate(VISITOR_POPULATE);

  try {
    if (flat.residentId) {
      await Notification.create({
        userId: flat.residentId._id,
        title: 'New visitor at the gate',
        body: `${input.visitorName} is at the gate — Flat ${flat.flatNumber}`,
        data: { type: 'visitor-approval', visitorId: String(visitor._id) },
      });

      await notifyResidentAboutVisitor(
        String(flat.residentId._id),
        input.visitorName,
        String(visitor._id),
        flat.flatNumber,
      );
    }
  } catch (error) {
    console.error('Visitor notification failed:', error);
  }

  res.status(201).json({ visitor: populated });
};

export const getVisitors = async (req: AuthRequest, res: Response): Promise<void> => {
  const { page, limit, status, flatId } = parseQuery(visitorQuerySchema, req);
  const filter: Record<string, unknown> = {
    ...visitorAccessFilter(req.user!),
    deletedAt: null,
  };

  if (status) filter.status = status;
  if (flatId) filter.flatId = flatId;

  const [visitors, total] = await Promise.all([
    Visitor.find(filter)
      .populate(VISITOR_POPULATE)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Visitor.countDocuments(filter),
  ]);

  res.json({
    visitors,
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
  });
};

export const getVisitorById = async (req: AuthRequest, res: Response): Promise<void> => {
  const visitor = await Visitor.findOne({
    ...visitorAccessFilter(req.user!, String(req.params.id)),
    deletedAt: null,
  })
    .select('+photoUrl')
    .populate(VISITOR_POPULATE);

  if (!visitor) throw new AppError('Visitor not found.', 404);
  res.json({ visitor });
};

export const updateVisitorStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  const { status } = visitorStatusSchema.parse(req.body);
  const visitor = await Visitor.findOne({
    ...visitorAccessFilter(req.user!, String(req.params.id)),
    deletedAt: null,
  });

  if (!visitor) throw new AppError('Visitor not found.', 404);

  if (
    req.user!.role === 'resident' &&
    String(visitor.residentId) !== String(req.user!._id)
  ) {
    throw new AppError('You can only update your own visitors.', 403);
  }

  if (!['pending', 'approved', 'rejected'].includes(visitor.status)) {
    throw new AppError('Invalid visitor status.', 400);
  }

  if (!['pending', 'approved', 'rejected'].includes(status)) {
    throw new AppError('Invalid status.', 400);
  }

  if (
    req.user!.role === 'resident' &&
    !(visitor.status === 'pending' && (status === 'approved' || status === 'rejected'))
  ) {
    throw new AppError('Residents can only approve or reject pending visitors.', 403);
  }

  if (visitor.status === status) {
    throw new AppError('Visitor is already in that status.', 400);
  }

  visitor.status = status;
  visitor.approvedBy = new Types.ObjectId(String(req.user!._id));
  visitor.approvedAt = new Date();
  visitor.statusHistory.push({
    status,
    changedBy: new Types.ObjectId(String(req.user!._id)),
    changedAt: new Date(),
  });

  if (status === 'pending') {
    visitor.approvedBy = undefined;
    visitor.approvedAt = undefined;
  }

  await visitor.save();
  const populated = await Visitor.findById(visitor._id).populate(VISITOR_POPULATE);
  res.json({ visitor: populated });
};

export const updateVisitor = async (req: AuthRequest, res: Response): Promise<void> => {
  const input = visitorUpdateSchema.parse(req.body);
  const visitor = await Visitor.findOne({
    ...visitorAccessFilter(req.user!, String(req.params.id)),
    deletedAt: null,
  });

  if (!visitor) throw new AppError('Visitor not found.', 404);

  if (input.flatId) {
    const flat = await Flat.findOne({
      _id: input.flatId,
      ...tenantFilter(req.user!),
    }).populate('residentId', 'fullName email phoneNumber');

    if (!flat) throw new AppError('Flat not found.', 404);
    visitor.flatId = flat._id as Types.ObjectId;
    visitor.societyId = flat.societyId;
    visitor.residentId = flat.residentId?._id as Types.ObjectId | undefined;
  }

  if (input.visitorName !== undefined) visitor.visitorName = input.visitorName;
  if (input.visitorType !== undefined) visitor.visitorType = input.visitorType;
  if (input.phoneNumber !== undefined) visitor.phoneNumber = input.phoneNumber;
  if (input.notes !== undefined) visitor.notes = input.notes;
  if (input.vehicleNumber !== undefined) visitor.vehicleNumber = input.vehicleNumber;

  await visitor.save();
  const populated = await Visitor.findById(visitor._id).populate(VISITOR_POPULATE);
  res.json({ visitor: populated });
};

export const deleteVisitor = async (req: AuthRequest, res: Response): Promise<void> => {
  const visitor = await Visitor.findOne({
    ...visitorAccessFilter(req.user!, String(req.params.id)),
    deletedAt: null,
  });

  if (!visitor) throw new AppError('Visitor not found.', 404);

  visitor.deletedAt = new Date();
  visitor.deletedBy = new Types.ObjectId(String(req.user!._id));
  await visitor.save();

  res.json({ message: 'Visitor deleted.' });
};

export const getVisitorStats = async (req: AuthRequest, res: Response): Promise<void> => {
  const baseFilter: Record<string, unknown> = {
    ...visitorAccessFilter(req.user!),
    deletedAt: null,
  };

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [total, pending, approvedToday, rejectedToday, today] = await Promise.all([
    Visitor.countDocuments(baseFilter),
    Visitor.countDocuments({ ...baseFilter, status: 'pending' }),
    Visitor.countDocuments({
      ...baseFilter,
      status: 'approved',
      createdAt: { $gte: startOfDay },
    }),
    Visitor.countDocuments({
      ...baseFilter,
      status: 'rejected',
      createdAt: { $gte: startOfDay },
    }),
    Visitor.countDocuments({ ...baseFilter, createdAt: { $gte: startOfDay } }),
  ]);

  res.json({
    total,
    pending,
    approvedToday,
    rejectedToday,
    today,
  });
};
