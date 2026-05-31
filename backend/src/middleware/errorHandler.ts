import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AppError';
  }
}

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error('Error:', err.message);

  if (err instanceof AppError) {
    res.status(err.statusCode).json({ message: err.message });
    return;
  }

  if (err.name === 'ValidationError') {
    res.status(400).json({ message: err.message });
    return;
  }

  if ((err as any).code === 11000) {
    res.status(400).json({ message: 'Duplicate entry found' });
    return;
  }

  res.status(500).json({ message: 'Internal server error' });
};
