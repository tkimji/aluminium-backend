import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const jwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not set');
  }
  return secret;
};

type JwtPayload = {
  userId: string;
  role: string;
};

declare global {
  namespace Express {
    interface Request {
      auth?: JwtPayload;
    }
  }
}

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const token = header.slice('Bearer '.length);
  try {
    const payload = jwt.verify(token, jwtSecret()) as JwtPayload;
    req.auth = payload;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
};
