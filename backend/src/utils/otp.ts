import crypto from 'crypto';
import { env } from '../config/env';

export const OTP_TTL_MS = 10 * 60 * 1000;
export const OTP_WINDOW_MS = 60 * 60 * 1000;
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_MAX_SENDS = 5;

export type OtpPurpose = 'auth' | 'profile';

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function generateOtp(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

export function hashOtp(otp: string, email: string, purpose: OtpPurpose): string {
  if (!env.jwtSecret) {
    throw new Error('JWT_SECRET is required for OTP hashing');
  }

  return crypto
    .createHmac('sha256', env.jwtSecret)
    .update(`${purpose}:${normalizeEmail(email)}:${otp}`)
    .digest('hex');
}

export function safeCompare(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) return false;
  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
