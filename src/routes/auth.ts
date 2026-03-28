import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

import { prisma } from '../prisma';
import { requireAuth } from '../middleware/auth';

const jwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not set');
  }
  return secret;
};

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['admin', 'tech', 'user']).optional(),
  phone: z.string().optional(),
  prefix: z.string().optional(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  houseNo: z.string().optional(),
  moo: z.string().optional(),
  road: z.string().optional(),
  province: z.string().optional(),
  district: z.string().optional(),
  subdistrict: z.string().optional(),
  postalCode: z.string().optional(),
  subscriptionPlan: z.enum(['monthly', 'yearly']).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const authRouter = Router();

authRouter.post('/register', async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid payload', errors: parsed.error.flatten() });
    return;
  }

  const data = parsed.data;
  const role = data.role ?? 'user';

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    res.status(409).json({ message: 'Email already in use' });
    return;
  }

  const passwordHash = await bcrypt.hash(data.password, 10);
  const status = role === 'tech' ? 'inactive' : 'active';
  const subscriptionPlan = data.subscriptionPlan ?? 'monthly';

  const result = await prisma.$transaction(async (tx) => {
    const profileData: any = {
      firstName: data.firstName,
      lastName: data.lastName,
    };
    if (data.prefix) profileData.prefix = data.prefix;
    if (data.houseNo) profileData.houseNo = data.houseNo;
    if (data.moo) profileData.moo = data.moo;
    if (data.road) profileData.road = data.road;
    if (data.province) profileData.province = data.province;
    if (data.district) profileData.district = data.district;
    if (data.subdistrict) profileData.subdistrict = data.subdistrict;
    if (data.postalCode) profileData.postalCode = data.postalCode;

    const userData: any = {
      email: data.email,
      passwordHash,
      role,
      status,
      profile: {
        create: profileData,
      },
    };
    if (data.phone) userData.phone = data.phone;

    const user = await tx.user.create({
      data: userData,
      include: { profile: true },
    });

    if (role === 'tech') {
      await tx.adminApproval.create({
        data: {
          userId: user.id,
          type: 'tech_registration',
          status: 'pending',
        },
      });

      await tx.subscription.create({
        data: {
          userId: user.id,
          plan: subscriptionPlan,
          status: 'pending',
        },
      });
    }

    return user;
  });

  const subscription = role === 'tech'
    ? await prisma.subscription.findFirst({
        where: { userId: result.id },
        orderBy: { createdAt: 'desc' },
      })
    : null;

  res.status(201).json({
    id: result.id,
    role: result.role,
    status: result.status,
    email: result.email,
    profile: result.profile,
    subscription,
  });
});

authRouter.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid payload', errors: parsed.error.flatten() });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    include: { profile: true },
  });

  if (!user) {
    res.status(401).json({ message: 'Invalid email or password' });
    return;
  }

  const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!ok) {
    res.status(401).json({ message: 'Invalid email or password' });
    return;
  }

  if (user.status !== 'active') {
    res.status(403).json({ message: 'User is not active' });
    return;
  }

  const token = jwt.sign({ userId: user.id, role: user.role }, jwtSecret(), {
    expiresIn: '7d',
  });

  res.json({
    token,
    user: {
      id: user.id,
      role: user.role,
      email: user.email,
      profile: user.profile,
    },
  });
});

authRouter.get('/me', requireAuth, async (req, res) => {
  const userId = req.auth?.userId;
  if (!userId) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { profile: true },
  });

  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }

  res.json({
    id: user.id,
    role: user.role,
    email: user.email,
    status: user.status,
    profile: user.profile,
  });
});
