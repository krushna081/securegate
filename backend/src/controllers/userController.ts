import { Response } from 'express';
import { Types } from 'mongoose';
import User from '../models/User';
import Flat from '../models/Flat';
import Society from '../models/Society';
import Notification from '../models/Notification';
import PreApproval from '../models/PreApproval';
import Visitor from '../models/Visitor';
import { AuthRequest } from '../middleware/authMiddleware';
import { AppError } from '../middleware/errorHandler';
import { issueOtp, verifyIssuedOtp } from '../services/otpService';
import { parseQuery } from '../middleware/validate';
import {
  ProfileVerificationPayload,
  signProfileVerificationToken,
  verifyToken,
} from '../utils/tokens';
import { assignResidentFlat, releaseResidentFlat } from '../utils/society';
import { toPublicUser, toPublicUserList } from '../utils/user';
import { escapeRegex } from '../utils/otp';
import { tenantFilter } from '../utils/tenant';
import {
  profileUpdateSchema,
  searchQuerySchema,
  staffCreateSchema,
  userQuerySchema,
} from '../validation/schemas';

const profilePopulate = [
  { path: 'societyId', select: 'name address' },
  { path: 'flatId', select: 'flatNumber blockName' },
];

export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await User.findById(req.user!._id)
    .populate('societyId', 'name address')
    .populate('flatId', 'flatNumber blockName');

  if (!user) throw new AppError('User not found', 404);

  res.json({ user: toPublicUser(user) });
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  const input = profileUpdateSchema.parse(req.body);
  const user = req.user!;

  if (input.phoneNumber !== undefined && input.phoneNumber !== user.phoneNumber) {
    if (!input.verificationToken) {
      throw new AppError('Changing your phone number requires email verification.', 400);
    }

    let verification: ProfileVerificationPayload;
    try {
      verification = verifyToken<ProfileVerificationPayload>(input.verificationToken);
    } catch {
      throw new AppError('Verification expired. Request a new code.', 400);
    }

    if (
      verification.purpose !== 'profile-verification' ||
      verification.userId !== String(user._id) ||
      verification.tokenVersion !== (user.tokenVersion ?? 0)
    ) {
      throw new AppError('Invalid verification token.', 400);
    }

    user.phoneNumber = input.phoneNumber;
  }

  if (input.fullName !== undefined) user.fullName = input.fullName;
  if (input.phoneNumber2 !== undefined) user.phoneNumber2 = input.phoneNumber2;
  if (input.gateNumber !== undefined) user.gateNumber = input.gateNumber;

  if (input.photoUrl !== undefined) {
    user.photoUrl = input.photoUrl ?? undefined;
  }

  const wantsFlatChange = input.flatNumber !== undefined || input.blockName !== undefined;
  if (wantsFlatChange) {
    if (user.role !== 'resident') {
      throw new AppError('Only residents can change their flat.', 403);
    }
    if (!input.flatNumber || !input.blockName) {
      throw new AppError('Both flat number and block are required.', 400);
    }
    if (!user.societyId) {
      throw new AppError('No society is assigned to your account.', 400);
    }

    const previousFlatId = user.flatId;
    const flat = await assignResidentFlat(
      user.societyId,
      input.flatNumber,
      input.blockName,
      user._id,
    );

    user.flatId = flat._id;

    if (previousFlatId && String(previousFlatId) !== String(flat._id)) {
      await Flat.updateOne({ _id: previousFlatId }, { $unset: { residentId: '' } });
    }
  }

  await user.save();

  const populated = await User.findById(user._id)
    .populate(profilePopulate)
    .select('-tokenVersion -pushToken');

  res.json({ user: populated });
};

export const sendProfileOtp = async (req: AuthRequest, res: Response): Promise<void> => {
  const result = await issueOtp(req.user!.email, 'profile');
  res.json({
    message: 'A verification code has been sent to your account email.',
    ...(result.devOtp ? { devOtp: result.devOtp } : {}),
  });
};

export const verifyProfileOtp = async (req: AuthRequest, res: Response): Promise<void> => {
  const { otp } = req.body as { otp: string };
  await verifyIssuedOtp(req.user!.email, otp, 'profile');

  res.json({
    verified: true,
    verificationToken: signProfileVerificationToken(
      String(req.user!._id),
      req.user!.tokenVersion ?? 0,
    ),
  });
};

export const getAllUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  const { page, limit, role } = parseQuery(userQuerySchema, req);
  const filter: Record<string, unknown> = {
    ...tenantFilter(req.user!),
    isActive: true,
  };
  if (role) filter.role = role;

  const [users, total] = await Promise.all([
    User.find(filter)
      .select('-tokenVersion -pushToken')
      .populate('societyId', 'name')
      .populate('flatId', 'flatNumber blockName')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    User.countDocuments(filter),
  ]);

  res.json({
    users: users.map((user) => toPublicUserList(user)),
    total,
    page,
    pages: Math.ceil(total / limit),
  });
};

export const getFlats = async (req: AuthRequest, res: Response): Promise<void> => {
  const filter = tenantFilter(req.user!);
  const flats = await Flat.find(filter)
    .populate('residentId', 'fullName email phoneNumber')
    .sort({ blockName: 1, flatNumber: 1 })
    .limit(500);

  res.json({ flats });
};

export const searchFlats = async (req: AuthRequest, res: Response): Promise<void> => {
  const { q } = parseQuery(searchQuerySchema, req);
  const regex = new RegExp(escapeRegex(q), 'i');

  const flats = await Flat.find({
    ...tenantFilter(req.user!),
    $or: [{ flatNumber: regex }, { blockName: regex }],
  })
    .populate('residentId', 'fullName email phoneNumber')
    .sort({ blockName: 1, flatNumber: 1 })
    .limit(30);

  res.json({ flats });
};

export const getSocieties = async (req: AuthRequest, res: Response): Promise<void> => {
  const filter = req.user!.societyId ? { _id: req.user!.societyId } : {};
  const societies = await Society.find(filter).sort({ name: 1 });
  res.json({ societies });
};

export const createStaff = async (req: AuthRequest, res: Response): Promise<void> => {
  const input = staffCreateSchema.parse(req.body);
  const societyId = req.user!.societyId ?? input.societyId;

  if (!societyId) {
    throw new AppError('Choose a society for this staff member.', 400);
  }

  const society = await Society.findById(societyId);
  if (!society) throw new AppError('Society not found.', 404);

  const existing = await User.findOne({ email: input.email });
  if (existing) throw new AppError('An account already exists for this email.', 409);

  const user = await User.create({
    email: input.email,
    fullName: input.fullName,
    phoneNumber: input.phoneNumber,
    role: input.role,
    societyId: society._id,
    gateNumber: input.gateNumber,
    tokenVersion: 0,
    isActive: true,
  });

  res.status(201).json({ user: toPublicUser(user) });
};

export const registerPushToken = async (req: AuthRequest, res: Response): Promise<void> => {
  const { pushToken } = req.body as { pushToken: string };
  await User.updateOne({ _id: req.user!._id }, { $set: { pushToken } });
  res.json({ success: true });
};

export const unregisterPushToken = async (req: AuthRequest, res: Response): Promise<void> => {
  await User.updateOne({ _id: req.user!._id }, { $unset: { pushToken: '' } });
  res.json({ success: true });
};

export const deleteAccount = async (req: AuthRequest, res: Response): Promise<void> => {
  const user = req.user!;

  if (user.role === 'admin') {
    const adminFilter: Record<string, unknown> = { role: 'admin', isActive: true };
    if (user.societyId) adminFilter.societyId = user.societyId;
    const adminCount = await User.countDocuments(adminFilter);
    if (adminCount <= 1) {
      throw new AppError(
        'Create another admin before deleting the last admin account.',
        409,
      );
    }
  }

  await releaseResidentFlat(user._id);
  await Notification.deleteMany({ userId: user._id });
  await PreApproval.deleteMany({ residentId: user._id });
  await Visitor.updateMany({ residentId: user._id }, { $unset: { residentId: '' } });

  await User.updateOne(
    { _id: user._id },
    {
      $set: {
        email: `deleted+${String(user._id)}@deleted.invalid`,
        fullName: 'Deleted account',
        phoneNumber: '0000000',
        role: 'resident',
        isActive: false,
        tokenVersion: (user.tokenVersion ?? 0) + 1,
      },
      $unset: {
        photoUrl: '',
        phoneNumber2: '',
        pushToken: '',
        flatId: '',
        gateNumber: '',
      },
    },
  );

  res.json({ message: 'Your account has been deleted.' });
};

export const getUserById = async (req: AuthRequest, res: Response): Promise<void> => {
  const id = String(req.params.id);
  if (!Types.ObjectId.isValid(id)) throw new AppError('Invalid identifier', 400);

  const user = await User.findOne({
    _id: id,
    ...tenantFilter(req.user!),
    isActive: true,
  })
    .select('-tokenVersion -pushToken')
    .populate('societyId', 'name address')
    .populate('flatId', 'flatNumber blockName');

  if (!user) throw new AppError('User not found', 404);
  res.json({ user: toPublicUserList(user) });
};
