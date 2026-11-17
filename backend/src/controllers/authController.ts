import { Request, Response } from 'express';
import User from '../models/User';
import { env } from '../config/env';
import { AuthRequest } from '../middleware/authMiddleware';
import { AppError } from '../middleware/errorHandler';
import { issueOtp, verifyIssuedOtp } from '../services/otpService';
import {
  RegistrationTokenPayload,
  signAuthToken,
  signRegistrationToken,
  verifyToken,
} from '../utils/tokens';
import { normalizeEmail, safeCompare } from '../utils/otp';
import { assignResidentFlat, getDefaultSociety } from '../utils/society';
import { toPublicUser } from '../utils/user';
import { CreateAccountInput } from '../validation/schemas';

export const sendOtp = async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body as { email: string };
  const result = await issueOtp(email, 'auth');

  res.json({
    message: 'If that email can receive mail, a verification code has been sent.',
    ...(result.devOtp ? { devOtp: result.devOtp } : {}),
  });
};

export const verifyOtp = async (req: Request, res: Response): Promise<void> => {
  const { email, otp } = req.body as { email: string; otp: string };
  const normalized = normalizeEmail(email);

  await verifyIssuedOtp(normalized, otp, 'auth');

  const user = await User.findOne({ email: normalized });
  if (!user) {
    res.json({
      isNewUser: true,
      registrationToken: signRegistrationToken(normalized),
    });
    return;
  }

  if (!user.isActive) {
    throw new AppError('This account has been deactivated.', 403);
  }

  res.json({
    isNewUser: false,
    token: signAuthToken(user),
    user: toPublicUser(user),
  });
};

export const createAccount = async (req: Request, res: Response): Promise<void> => {
  const input = req.body as CreateAccountInput;

  let registration: RegistrationTokenPayload;
  try {
    registration = verifyToken<RegistrationTokenPayload>(input.registrationToken);
  } catch {
    throw new AppError('Registration verification expired. Request a new code.', 400);
  }

  if (registration.purpose !== 'registration' || !registration.email) {
    throw new AppError('Invalid registration token.', 400);
  }

  const email = normalizeEmail(registration.email);
  const existing = await User.findOne({ email });
  if (existing) {
    throw new AppError('An account already exists for this email. Sign in instead.', 409);
  }

  const role = input.role;
  if (role === 'guard') {
    if (
      !env.guardInviteCode ||
      !input.inviteCode ||
      !safeCompare(input.inviteCode, env.guardInviteCode)
    ) {
      throw new AppError(
        'Guard registration is invite-only. Ask your society admin for an invite code.',
        403,
      );
    }
  }

  const society = await getDefaultSociety();
  const user = await User.create({
    email,
    fullName: input.fullName,
    phoneNumber: input.phoneNumber,
    role,
    societyId: society._id,
    tokenVersion: 0,
    isActive: true,
  });

  if (role === 'resident') {
    try {
      const flat = await assignResidentFlat(
        society._id,
        input.flatNumber!,
        input.blockName!,
        user._id,
      );
      user.flatId = flat._id;
      await user.save();
    } catch (error) {
      await User.deleteOne({ _id: user._id });
      throw error;
    }
  }

  res.status(201).json({
    token: signAuthToken(user),
    user: toPublicUser(user),
  });
};

export const logout = async (req: AuthRequest, res: Response): Promise<void> => {
  const user = req.user!;
  user.tokenVersion = (user.tokenVersion ?? 0) + 1;
  await user.save();
  res.json({ message: 'Signed out on all devices.' });
};
