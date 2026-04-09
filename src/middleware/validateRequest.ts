import type { NextFunction, Request, Response } from 'express';
import type { z } from 'zod';

import { logger } from '../logger';

type Schema = z.ZodType;

export const validateBody =
  (schema: Schema) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      const errors = parsed.error.issues.map((issue) => ({
        field: issue.path.length ? issue.path.join('.') : 'root',
        message: issue.message,
      }));
      logger.warn('Request validation failed', { path: req.path, errors });
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        data: { errors },
      });
      return;
    }
    req.body = parsed.data;
    next();
  };
