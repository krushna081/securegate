import dotenv from 'dotenv';

dotenv.config({ quiet: true });

const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';

const rawJwtSecret = (process.env.JWT_SECRET || '').trim();
const rawResendKey = (process.env.RESEND_API_KEY || '').trim();
const resendIsPlaceholder =
  !rawResendKey ||
  rawResendKey.includes('XXXX') ||
  rawResendKey.toLowerCase().includes('changeme');

const parseOrigins = (value?: string): string[] =>
  (value || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

export const env = {
  nodeEnv,
  isProduction,
  port: Number(process.env.PORT) || 5000,
  mongoUri:
    process.env.MONGO_URI ||
    process.env.MONGODB_URI ||
    'mongodb://localhost:27017/securegate',
  jwtSecret: rawJwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  jwtIssuer: 'securegate-api',
  jwtAudience: 'securegate-app',
  resendApiKey: resendIsPlaceholder ? '' : rawResendKey,
  emailFrom: process.env.EMAIL_FROM || 'SecureGate <onboarding@resend.dev>',
  corsOrigins: parseOrigins(process.env.CORS_ORIGINS || process.env.FRONTEND_URL),
  guardInviteCode: (process.env.GUARD_INVITE_CODE || '').trim(),
  societyName: (process.env.SOCIETY_NAME || 'SecureGate Community').trim(),
  societyAddress: (process.env.SOCIETY_ADDRESS || '').trim(),
  allowDevOtp: process.env.ALLOW_DEV_OTP === 'true' && !isProduction,
  trustProxy: Number(process.env.TRUST_PROXY ?? 1),
};

export function assertConfig(): void {
  if (!env.jwtSecret || env.jwtSecret.length < 32) {
    throw new Error(
      'JWT_SECRET is missing or too short. Generate one with: openssl rand -hex 32',
    );
  }

  if (env.isProduction && !env.resendApiKey) {
    throw new Error(
      'RESEND_API_KEY is required in production. OTP login cannot run without email delivery.',
    );
  }

  if (env.isProduction && env.allowDevOtp) {
    throw new Error('ALLOW_DEV_OTP must never be enabled in production.');
  }

  if (env.isProduction && env.corsOrigins.length === 0) {
    console.warn(
      'CORS_ORIGINS is not set. Browser origins will be rejected; native mobile clients are unaffected.',
    );
  }
}
