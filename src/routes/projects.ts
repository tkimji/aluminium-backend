import { Router } from 'express';
import { z } from 'zod';

import { prisma } from '../prisma';
import { requireAuth } from '../middleware/auth';
import { requireRoleOrAdmin } from '../middleware/roles';

const projectSchema = z.object({
  code: z.string().optional(),
  name: z.string().min(1),
  customerName: z.string().min(1),
  phone: z.string().min(1),
  taxId: z.string().optional(),
  houseNo: z.string().optional(),
  moo: z.string().optional(),
  building: z.string().optional(),
  soi: z.string().optional(),
  road: z.string().optional(),
  province: z.string().optional(),
  district: z.string().optional(),
  subdistrict: z.string().optional(),
  postalCode: z.string().optional(),
});

const projectUpdateSchema = projectSchema.partial().extend({
  name: z.string().min(1).optional(),
  customerName: z.string().min(1).optional(),
  phone: z.string().min(1).optional(),
});

const itemSchema = z.object({
  productId: z.string().optional(),
  formulaId: z.string().optional(),
  colorId: z.string().optional(),
  brandId: z.string().optional(),
  width: z.coerce.number().int().optional(),
  height: z.coerce.number().int().optional(),
  length: z.coerce.number().int().optional(),
  panelCount: z.coerce.number().int().optional(),
  quantity: z.coerce.number().int().optional(),
  unit: z.string().optional(),
  glassTypeId: z.string().optional(),
  glassThicknessId: z.string().optional(),
  glassWidth: z.coerce.number().int().optional(),
  glassHeight: z.coerce.number().int().optional(),
  glassThicknessMm: z.coerce.number().optional(),
  glassQuantity: z.coerce.number().int().optional(),
  price: z.coerce.number().optional(),
  status: z.enum(['DRAFT', 'IN_CART', 'IN_ORDER', 'QUOTED']).optional(),
});

export const projectsRouter = Router();

// Public — no auth required
projectsRouter.get('/showcase', async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 6, 20);
  const data = await prisma.project.findMany({
    where: { status: { in: ['done', 'ordered', 'paid'] } },
    orderBy: { updatedAt: 'desc' },
    take: limit,
    select: {
      id: true,
      name: true,
      code: true,
      status: true,
      updatedAt: true,
      items: {
        take: 1,
        select: {
          product: { select: { name: true, imageUrl: true } },
        },
      },
    },
  });

  const projects = data.map((p) => {
    const firstProduct = p.items[0]?.product;
    return {
      id: p.id,
      name: p.name,
      code: p.code,
      status: p.status,
      updatedAt: p.updatedAt,
      imageUrl: firstProduct?.imageUrl ?? null,
      productName: firstProduct?.name ?? null,
    };
  });

  res.json({ data: projects });
});

// All routes below require auth
projectsRouter.use(requireAuth, requireRoleOrAdmin('tech'));

// ใช้ path สอง segment (/meta/glass-types) เพื่อไม่ให้ชนกับ GET /:id (id = "glass-types" → Project not found)
projectsRouter.get('/meta/glass-types', async (_req, res) => {
  const data = await prisma.glassType.findMany({
    orderBy: { name: 'asc' },
  });
  res.json({ data });
});

projectsRouter.get('/', async (req, res) => {
  const role = req.auth?.role;
  const userId = req.auth?.userId;

  const where: any = {};
  if (role !== 'admin' && userId) {
    where.createdById = userId;
  }

  const data = await prisma.project.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  res.json({ data });
});

projectsRouter.post('/', async (req, res) => {
  const parsed = projectSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid payload', errors: parsed.error.flatten() });
    return;
  }

  const cleanData = Object.fromEntries(
    Object.entries(parsed.data).filter(([_, v]) => v !== undefined)
  );

  const created = await prisma.project.create({
    data: {
      ...cleanData,
      createdById: req.auth?.userId as string,
    } as any,
  });

  res.status(201).json(created);
});

projectsRouter.get('/:id', async (req, res) => {
  const project = await prisma.project.findUnique({
    where: { id: req.params.id },
    include: { 
      items: {
        include: {
          product: true,
          brand: true,
          color: true,
          formula: true
        }
      }
    },
  });

  if (!project) {
    res.status(404).json({ message: 'Project not found' });
    return;
  }

  if (req.auth?.role !== 'admin' && project.createdById !== req.auth?.userId) {
    res.status(403).json({ message: 'Forbidden' });
    return;
  }

  res.json({ data: project });
});

projectsRouter.patch('/:id', async (req, res) => {
  const parsed = projectUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid payload', errors: parsed.error.flatten() });
    return;
  }

  const project = await prisma.project.findUnique({ where: { id: req.params.id } });
  if (!project) {
    res.status(404).json({ message: 'Project not found' });
    return;
  }

  if (req.auth?.role !== 'admin' && project.createdById !== req.auth?.userId) {
    res.status(403).json({ message: 'Forbidden' });
    return;
  }

  const cleanData = Object.fromEntries(
    Object.entries(parsed.data).filter(([_, v]) => v !== undefined)
  );

  const updated = await prisma.project.update({
    where: { id: project.id },
    data: cleanData,
  });

  res.json(updated);
});

projectsRouter.post('/:id/items', async (req, res) => {
  const parsed = itemSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid payload', errors: parsed.error.flatten() });
    return;
  }

  const project = await prisma.project.findUnique({ where: { id: req.params.id } });
  if (!project) {
    res.status(404).json({ message: 'Project not found' });
    return;
  }

  if (req.auth?.role !== 'admin' && project.createdById !== req.auth?.userId) {
    res.status(403).json({ message: 'Forbidden' });
    return;
  }

  // แปลง empty string เป็น null สำหรับ foreign keys
  const cleanData = Object.fromEntries(
    Object.entries(parsed.data)
      .filter(([_, v]) => v !== undefined)
      .map(([k, v]) => [k, v === '' ? null : v])
  );

  const created = await prisma.projectItem.create({
    data: {
      projectId: project.id,
      ...cleanData,
    } as any,
  });

  res.status(201).json(created);
});

projectsRouter.patch('/:id/items/:itemId', async (req, res) => {
  const parsed = itemSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid payload', errors: parsed.error.flatten() });
    return;
  }

  const item = await prisma.projectItem.findUnique({
    where: { id: req.params.itemId },
    include: { project: true },
  });

  if (!item || item.projectId !== req.params.id) {
    res.status(404).json({ message: 'Item not found' });
    return;
  }

  if (req.auth?.role !== 'admin' && item.project.createdById !== req.auth?.userId) {
    res.status(403).json({ message: 'Forbidden' });
    return;
  }

  const cleanData = Object.fromEntries(
    Object.entries(parsed.data)
      .filter(([_, v]) => v !== undefined)
      .map(([k, v]) => [k, v === '' ? null : v])
  );

  const updated = await prisma.projectItem.update({
    where: { id: item.id },
    data: cleanData,
  });

  res.json(updated);
});

projectsRouter.delete('/:id/items/:itemId', async (req, res) => {
  const item = await prisma.projectItem.findUnique({
    where: { id: req.params.itemId },
    include: { project: true },
  });

  if (!item || item.projectId !== req.params.id) {
    res.status(404).json({ message: 'Item not found' });
    return;
  }

  if (req.auth?.role !== 'admin' && item.project.createdById !== req.auth?.userId) {
    res.status(403).json({ message: 'Forbidden' });
    return;
  }

  await prisma.projectItem.delete({ where: { id: item.id } });
  res.status(204).send();
});
