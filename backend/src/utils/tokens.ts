import jwt, { JwtPayload } from 'jsonwebtoken';
import { env } from '../config/env';
import { UserRole } from '../utils/tenant';

export interface AuthTokenPayload extends JwtPayload {
  purpose: 'auth';
  userId: string;
  role: UserRole;
  tokenVersion: number;
}

export interface RegistrationTokenPayload extends JwtPayload {
  purpose: 'registration';
  email: string;
}

export interface ProfileVerificationPayload extends JwtPayload {
  purpose: 'profile-verification';
  userId: string;
  tokenVersion: number;
}

type TokenUser = {
  _id: unknown;
  role: UserRole;
  tokenVersion?: number;
};

const baseOptions = {
  issuer: env.jwtIssuer,
  audience: env.jwtAudience,
};

export function signAuthToken(user: TokenUser): string {
  return jwt.sign(
    {
      purpose: 'auth',
      userId: String(user._id),
      role: user.role,
      tokenVersion: user.tokenVersion ?? 0,
    },
    env.jwtSecret,
    {
      ...baseOptions,
      expiresIn: env.jwtExpiresIn as jwt.SignOptions['expiresIn'],
    },
  );
}

export function signRegistrationToken(email: string): string {
  return jwt.sign({ purpose: 'registration', email }, env.jwtSecret, {
    ...baseOptions,
    expiresIn: '10m',
  });
}

export function signProfileVerificationToken(
  userId: string,
  tokenVersion: number,
): string {
  return jwt.sign(
    { purpose: 'profile-verification', userId, tokenVersion },
    env.jwtSecret,
    { ...baseOptions, expiresIn: '10m' },
  );
}

export function verifyToken<T extends JwtPayload>(token: string): T {
  const decoded = jwt.verify(token, env.jwtSecret, {
    issuer: env.jwtIssuer,
    audience: env.jwtAudience,
  });

  if (typeof decoded === 'string') {
    throw new Error('Invalid token payload');
  }

  return decoded as T;
}
