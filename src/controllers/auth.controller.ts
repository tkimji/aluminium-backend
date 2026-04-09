import type { NextFunction, Request, Response } from 'express';

import { authService } from '../services/auth.service';
import type { RegisterBody } from '../validation/auth.validation';

export const authController = {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await authService.register(req.body as RegisterBody);
      res.status(201).json({
        success: true,
        message: 'Registered successfully',
        data,
      });
    } catch (err) {
      next(err);
    }
  },
};
