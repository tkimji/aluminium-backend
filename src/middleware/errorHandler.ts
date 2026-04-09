import type { NextFunction, Request, Response } from 'express';

import { AppError } from '../errors/AppError';
import { logger } from '../logger';

export const errorHandler = (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error(err.message, { data: err.data });
    }
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      data: err.data,
    });
    return;
  }

  logger.error('Unexpected error', { err });
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    data: null,
  });
};
