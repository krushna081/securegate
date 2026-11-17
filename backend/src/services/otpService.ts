import Otp from '../models/Otp';
import { sendOtpEmail } from './emailService';
import { env } from '../config/env';
import { AppError } from '../middleware/errorHandler';
import {
  OTP_MAX_ATTEMPTS,
  OTP_MAX_SENDS,
  OTP_TTL_MS,
  OTP_WINDOW_MS,
  OtpPurpose,
  generateOtp,
  hashOtp,
  normalizeEmail,
  safeCompare,
} from '../utils/otp';

export interface IssuedOtp {
  devOtp?: string;
}

export async function issueOtp(email: string, purpose: OtpPurpose): Promise<IssuedOtp> {
  const normalized = normalizeEmail(email);
  const now = new Date();

  let record = await Otp.findOne({ email: normalized, purpose });

  if (record && now.getTime() - record.windowStart.getTime() > OTP_WINDOW_MS) {
    record.sendCount = 0;
    record.windowStart = now;
  }

  if ((record?.sendCount ?? 0) >= OTP_MAX_SENDS) {
    throw new AppError('Too many codes requested. Try again in an hour.', 429);
  }

  const otp = generateOtp();
  const otpHash = hashOtp(otp, normalized, purpose);
  const expiresAt = new Date(now.getTime() + OTP_TTL_MS);

  if (record) {
    record.otpHash = otpHash;
    record.expiresAt = expiresAt;
    record.attempts = 0;
    record.sendCount += 1;
    await record.save();
  } else {
    record = await Otp.create({
      email: normalized,
      purpose,
      otpHash,
      expiresAt,
      attempts: 0,
      sendCount: 1,
      windowStart: now,
    });
  }

  let delivered = false;
  try {
    delivered = await sendOtpEmail(normalized, otp, purpose);
  } catch (error) {
    console.error('OTP email failure:', error);
  }

  if (!delivered) {
    if (env.allowDevOtp) {
      return { devOtp: otp };
    }

    await Otp.deleteOne({ _id: record._id });
    throw new AppError(
      'Email delivery is not configured. Contact the administrator.',
      503,
    );
  }

  return {};
}

export async function verifyIssuedOtp(
  email: string,
  otp: string,
  purpose: OtpPurpose,
): Promise<void> {
  const normalized = normalizeEmail(email);
  const record = await Otp.findOne({ email: normalized, purpose }).select('+otpHash');

  if (!record || record.expiresAt.getTime() < Date.now()) {
    if (record) await Otp.deleteOne({ _id: record._id });
    throw new AppError('That code is invalid or has expired.', 400);
  }

  if (record.attempts >= OTP_MAX_ATTEMPTS) {
    await Otp.deleteOne({ _id: record._id });
    throw new AppError('Too many attempts. Request a new code.', 429);
  }

  const matches = safeCompare(hashOtp(otp, normalized, purpose), record.otpHash);

  if (!matches) {
    record.attempts += 1;
    await record.save();
    throw new AppError('That code is invalid or has expired.', 400);
  }

  await Otp.deleteOne({ _id: record._id });
}
