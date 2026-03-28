import type { Request, Response, NextFunction } from 'express';

export const requireRole = (roles: string | string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.auth) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const allowedRoles = Array.isArray(roles) ? roles : roles.split(',').map(r => r.trim());
    if (!allowedRoles.includes(req.auth.role)) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    next();
  };
};

export const requireRoleOrAdmin = (role: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.auth) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    if (req.auth.role !== role && req.auth.role !== 'admin') {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    next();
  };
};
