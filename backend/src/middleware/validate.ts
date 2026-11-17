import { NextFunction, Request, Response } from 'express';
import { ZodType } from 'zod';

function formatIssues(error: { issues: Array<{ path: PropertyKey[]; message: string }> }): string {
  return error.issues
    .map((issue) => {
      const path = issue.path.length ? `${issue.path.join('.')}: ` : '';
      return `${path}${issue.message}`;
    })
    .join('; ');
}

export function validateBody<T>(schema: ZodType<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ message: formatIssues(result.error) });
      return;
    }
    req.body = result.data;
    next();
  };
}

export function validateParams<T>(schema: ZodType<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      res.status(400).json({ message: formatIssues(result.error) });
      return;
    }
    res.locals.params = result.data;
    next();
  };
}

export function parseQuery<T>(schema: ZodType<T>, req: Request): T {
  const result = schema.safeParse(req.query);
  if (!result.success) {
    const error = new Error(formatIssues(result.error)) as Error & {
      statusCode?: number;
    };
    error.statusCode = 400;
    throw error;
  }
  return result.data;
}
