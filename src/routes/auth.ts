import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

import { authController } from '../controllers/auth.controller';
import { prisma } from '../prisma';
import { requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validateRequest';
import { loginSchema, registerSchema } from '../validation/auth.validation';

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
});

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
      phone: user.phone,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      profile: user.profile,
    },
  });
});

authRouter.post('/change-password', requireAuth, async (req, res) => {
  const parsed = changePasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      message: 'Invalid payload',
      data: { errors: parsed.error.flatten() },
    });
    return;
  }

  const userId = req.auth?.userId;
  if (!userId) {
    res.status(401).json({ success: false, message: 'Unauthorized', data: null });
    return;
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    res.status(404).json({ success: false, message: 'User not found', data: null });
    return;
  }

  const match = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
  if (!match) {
    res.status(400).json({
      success: false,
      message: 'รหัสผ่านปัจจุบันไม่ถูกต้อง',
      data: null,
    });
    return;
  }

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 10);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });

  res.json({
    success: true,
    message: 'เปลี่ยนรหัสผ่านสำเร็จ',
    data: { updated: true },
  });
});
