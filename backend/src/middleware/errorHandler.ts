import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AppError';
  }
}

export const errorHandler = (
  err: Error & { statusCode?: number; code?: number; name?: string },
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  if (err instanceof ZodError) {
    const message = err.issues
      .map((issue) => `${issue.path.join('.') || 'request'}: ${issue.message}`)
      .join('; ');
    res.status(400).json({ message });
    return;
  }

  if (err.name === 'CastError') {
    res.status(400).json({ message: 'Invalid identifier' });
    return;
  }

  if (err.code === 11000) {
    res.status(409).json({ message: 'That record already exists' });
    return;
  }

  const statusCode = err.statusCode || 500;
  if (statusCode >= 500) {
    console.error('Unhandled error:', req.method, req.path, err.message);
  }

  res.status(statusCode).json({
    message: statusCode >= 500 ? 'Something went wrong' : err.message,
  });
};

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.path}` });
};
