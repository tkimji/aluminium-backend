import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import { authController } from '../controllers/auth.controller';
import { prisma } from '../prisma';
import { requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validateRequest';
import { loginSchema, registerSchema } from '../validation/auth.validation';

const jwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not set');
  }
  return secret;
};

export const authRouter = Router();

authRouter.post('/register', validateBody(registerSchema), (req, res, next) => {
  void authController.register(req, res, next);
});

authRouter.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    const errors = parsed.error.issues.map((issue) => ({
      field: issue.path.length ? issue.path.join('.') : 'root',
      message: issue.message,
    }));
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      data: { errors },
    });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    include: { profile: true },
  });

  if (!user) {
    res.status(401).json({ success: false, message: 'Invalid email or password', data: null });
    return;
  }

  const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!ok) {
    res.status(401).json({ success: false, message: 'Invalid email or password', data: null });
    return;
  }

  if (user.status !== 'active') {
    res.status(403).json({ success: false, message: 'User is not active', data: null });
    return;
  }

  const token = jwt.sign({ userId: user.id, role: user.role }, jwtSecret(), {
    expiresIn: '7d',
  });

  res.json({
    success: true,
    message: 'OK',
    data: {
      token,
      user: {
        id: user.id,
        role: user.role,
        email: user.email,
        profile: user.profile,
      },
    },
  });
});

authRouter.get('/me', requireAuth, async (req, res) => {
  const userId = req.auth?.userId;
  if (!userId) {
    res.status(401).json({ success: false, message: 'Unauthorized', data: null });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { profile: true },
  });

  if (!user) {
    res.status(404).json({ success: false, message: 'User not found', data: null });
    return;
  }

  res.json({
    success: true,
    message: 'OK',
    data: {
      id: user.id,
      role: user.role,
      email: user.email,
      status: user.status,
      profile: user.profile,
    },
  });
});
