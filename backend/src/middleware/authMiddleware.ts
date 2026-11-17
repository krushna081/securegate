import { NextFunction, Request, Response } from 'express';
import User, { IUser } from '../models/User';
import { AuthTokenPayload, verifyToken } from '../utils/tokens';

export interface AuthRequest extends Request {
  user?: IUser;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ message: 'No token provided' });
      return;
    }

    const token = authHeader.slice('Bearer '.length).trim();
    const decoded = verifyToken<AuthTokenPayload>(token);

    if (decoded.purpose !== 'auth') {
      res.status(401).json({ message: 'Invalid token' });
      return;
    }

    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      res.status(401).json({ message: 'User not found or inactive' });
      return;
    }

    if ((user.tokenVersion ?? 0) !== decoded.tokenVersion) {
      res.status(401).json({ message: 'Session expired. Please sign in again.' });
      return;
    }

    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

export const authorize = (...roles: Array<'guard' | 'resident' | 'admin'>) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ message: 'Insufficient permissions' });
      return;
    }
    next();
  };
};
