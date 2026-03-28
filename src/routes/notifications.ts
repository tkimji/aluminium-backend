import { Router } from 'express';
import { z } from 'zod';

import { prisma } from '../prisma';
import { requireAuth } from '../middleware/auth';

const createSchema = z.object({
  userId: z.string().min(1),
  message: z.string().min(1),
  tone: z.enum(['green', 'orange', 'yellow']),
});

export const notificationsRouter = Router();
notificationsRouter.use(requireAuth);

notificationsRouter.get('/', async (req, res) => {
  const status = req.query.status ? String(req.query.status) : undefined;

  const where: any = {};
  if (req.auth?.userId) where.userId = req.auth.userId;
  if (status) where.status = status;

  const data = await prisma.notification.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  res.json({ data });
});

notificationsRouter.post('/', async (req, res) => {
  if (req.auth?.role !== 'admin') {
    res.status(403).json({ message: 'Forbidden' });
    return;
  }

  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid payload', errors: parsed.error.flatten() });
    return;
  }

  const created = await prisma.notification.create({
    data: {
      userId: parsed.data.userId,
      message: parsed.data.message,
      tone: parsed.data.tone,
    },
  });

  res.status(201).json(created);
});

notificationsRouter.post('/read-all', async (req, res) => {
  const where: any = { status: 'unread' };
  if (req.auth?.userId) where.userId = req.auth.userId;

  await prisma.notification.updateMany({
    where,
    data: { status: 'read', readAt: new Date() },
  });

  res.json({ ok: true });
});

notificationsRouter.post('/:id/read', async (req, res) => {
  const notification = await prisma.notification.findUnique({ where: { id: req.params.id } });
  if (!notification) {
    res.status(404).json({ message: 'Notification not found' });
    return;
  }

  if (req.auth?.userId && notification.userId !== req.auth.userId) {
    res.status(403).json({ message: 'Forbidden' });
    return;
  }

  const updated = await prisma.notification.update({
    where: { id: notification.id },
    data: { status: 'read', readAt: new Date() },
  });

  res.json(updated);
});
