import { Router } from 'express';
import { z } from 'zod';

import { prisma } from '../prisma';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/roles';

const etaxSchema = z.object({
  orderId: z.string().min(1),
  legalName: z.string().min(1),
  taxId: z.string().min(1),
  houseNo: z.string().optional(),
  moo: z.string().optional(),
  road: z.string().optional(),
  province: z.string().optional(),
  district: z.string().optional(),
  subdistrict: z.string().optional(),
  postalCode: z.string().optional(),
});

export const etaxRouter = Router();
etaxRouter.use(requireAuth);

etaxRouter.post('/', async (req, res) => {
  const parsed = etaxSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid payload', errors: parsed.error.flatten() });
    return;
  }

  const order = await prisma.order.findUnique({
    where: { id: parsed.data.orderId },
    include: { project: true },
  });

  if (!order) {
    res.status(404).json({ message: 'Order not found' });
    return;
  }

  if (req.auth?.role !== 'admin') {
    if (!order.project || order.project.createdById !== req.auth?.userId) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }
  }

  const existing = await prisma.etaxRequest.findUnique({
    where: { orderId: order.id },
  });

  if (existing) {
    res.status(409).json({ message: 'e-Tax already submitted' });
    return;
  }

  const cleanData = Object.fromEntries(
    Object.entries(parsed.data).filter(([_, v]) => v !== undefined)
  );

  const created = await prisma.etaxRequest.create({
    data: cleanData as any,
  });

  res.status(201).json(created);
});

etaxRouter.get('/:orderId', async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.orderId },
    include: { project: true, etax: true },
  });

  if (!order) {
    res.status(404).json({ message: 'Order not found' });
    return;
  }

  if (req.auth?.role !== 'admin') {
    if (!order.project || order.project.createdById !== req.auth?.userId) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }
  }

  res.json(order.etax);
});

etaxRouter.patch('/:orderId', async (req, res) => {
  const parsed = etaxSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid payload', errors: parsed.error.flatten() });
    return;
  }

  const order = await prisma.order.findUnique({
    where: { id: req.params.orderId },
    include: { project: true, etax: true },
  });

  if (!order || !order.etax) {
    res.status(404).json({ message: 'e-Tax not found' });
    return;
  }

  if (req.auth?.role !== 'admin') {
    if (!order.project || order.project.createdById !== req.auth?.userId) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }
  }

  const cleanData = Object.fromEntries(
    Object.entries(parsed.data).filter(([_, v]) => v !== undefined)
  );

  const updated = await prisma.etaxRequest.update({
    where: { id: order.etax.id },
    data: cleanData,
  });

  res.json(updated);
});
