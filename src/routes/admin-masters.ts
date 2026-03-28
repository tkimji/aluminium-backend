import { Router } from 'express';
import { z } from 'zod';

import { prisma } from '../prisma';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/roles';

const baseSchema = z.object({
  code: z.string().optional(),
  name: z.string().min(1),
  status: z.enum(['active', 'inactive']).optional(),
});

const glassThicknessSchema = z.object({
  code: z.string().optional(),
  thicknessMm: z.coerce.number().int().min(1),
  status: z.enum(['active', 'inactive']).optional(),
});

const glassTypeSchema = z.object({
  code: z.string().optional(),
  name: z.string().min(1),
  widthMm: z.coerce.number().optional(),
  heightMm: z.coerce.number().optional(),
  status: z.enum(['active', 'inactive']).optional(),
});

const updateBaseSchema = baseSchema.partial().extend({
  name: z.string().min(1).optional(),
});

const updateGlassThicknessSchema = glassThicknessSchema.partial().extend({
  thicknessMm: z.coerce.number().int().min(1).optional(),
});

const updateGlassTypeSchema = glassTypeSchema.partial().extend({
  name: z.string().min(1).optional(),
});

const searchQuery = (req: any) => String(req.query.search ?? '').trim();

export const adminMastersRouter = Router();
adminMastersRouter.use(requireAuth, requireRole('admin'));

adminMastersRouter.get('/product-types', async (req, res) => {
  const search = searchQuery(req);
  const data = await prisma.productType.findMany({
    ...(search && {
      where: {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { code: { contains: search, mode: 'insensitive' } },
        ],
      },
    }),
    orderBy: { createdAt: 'desc' },
  });
  res.json({ data });
});

adminMastersRouter.post('/product-types', async (req, res) => {
  const parsed = baseSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid payload', errors: parsed.error.flatten() });
    return;
  }
  const cleanData = Object.fromEntries(
    Object.entries(parsed.data).filter(([_, v]) => v !== undefined)
  );
  const created = await prisma.productType.create({ data: cleanData as any });
  res.status(201).json(created);
});

adminMastersRouter.patch('/product-types/:id', async (req, res) => {
  const parsed = updateBaseSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid payload', errors: parsed.error.flatten() });
    return;
  }
  const cleanData = Object.fromEntries(
    Object.entries(parsed.data).filter(([_, v]) => v !== undefined)
  );
  const updated = await prisma.productType.update({
    where: { id: req.params.id },
    data: cleanData,
  });
  res.json(updated);
});

adminMastersRouter.get('/units', async (req, res) => {
  const search = searchQuery(req);
  const data = await prisma.unit.findMany({
    ...(search && {
      where: {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { code: { contains: search, mode: 'insensitive' } },
        ],
      },
    }),
    orderBy: { createdAt: 'desc' },
  });
  res.json({ data });
});

adminMastersRouter.post('/units', async (req, res) => {
  const parsed = baseSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid payload', errors: parsed.error.flatten() });
    return;
  }
  const cleanData = Object.fromEntries(
    Object.entries(parsed.data).filter(([_, v]) => v !== undefined)
  );
  const created = await prisma.unit.create({ data: cleanData as any });
  res.status(201).json(created);
});

adminMastersRouter.patch('/units/:id', async (req, res) => {
  const parsed = updateBaseSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid payload', errors: parsed.error.flatten() });
    return;
  }
  const cleanData = Object.fromEntries(
    Object.entries(parsed.data).filter(([_, v]) => v !== undefined)
  );
  const updated = await prisma.unit.update({
    where: { id: req.params.id },
    data: cleanData,
  });
  res.json(updated);
});

adminMastersRouter.get('/colors', async (req, res) => {
  const search = searchQuery(req);
  const data = await prisma.color.findMany({
    ...(search && {
      where: {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { code: { contains: search, mode: 'insensitive' } },
        ],
      },
    }),
    orderBy: { createdAt: 'desc' },
  });
  res.json({ data });
});

adminMastersRouter.post('/colors', async (req, res) => {
  const parsed = baseSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid payload', errors: parsed.error.flatten() });
    return;
  }
  const cleanData = Object.fromEntries(
    Object.entries(parsed.data).filter(([_, v]) => v !== undefined)
  );
  const created = await prisma.color.create({ data: cleanData as any });
  res.status(201).json(created);
});

adminMastersRouter.patch('/colors/:id', async (req, res) => {
  const parsed = updateBaseSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid payload', errors: parsed.error.flatten() });
    return;
  }
  const cleanData = Object.fromEntries(
    Object.entries(parsed.data).filter(([_, v]) => v !== undefined)
  );
  const updated = await prisma.color.update({
    where: { id: req.params.id },
    data: cleanData,
  });
  res.json(updated);
});

adminMastersRouter.get('/glass-types', async (req, res) => {
  const search = searchQuery(req);
  const data = await prisma.glassType.findMany({
    ...(search && {
      where: {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { code: { contains: search, mode: 'insensitive' } },
        ],
      },
    }),
    orderBy: { createdAt: 'desc' },
  });
  res.json({ data });
});

adminMastersRouter.post('/glass-types', async (req, res) => {
  const parsed = glassTypeSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid payload', errors: parsed.error.flatten() });
    return;
  }
  const cleanData = Object.fromEntries(
    Object.entries(parsed.data).filter(([_, v]) => v !== undefined)
  );
  const created = await prisma.glassType.create({ data: cleanData as any });
  res.status(201).json(created);
});

adminMastersRouter.patch('/glass-types/:id', async (req, res) => {
  const parsed = updateGlassTypeSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid payload', errors: parsed.error.flatten() });
    return;
  }
  const cleanData = Object.fromEntries(
    Object.entries(parsed.data).filter(([_, v]) => v !== undefined)
  );
  const updated = await prisma.glassType.update({
    where: { id: req.params.id },
    data: cleanData,
  });
  res.json(updated);
});

adminMastersRouter.get('/glass-thickness', async (req, res) => {
  const search = searchQuery(req);
  const numSearch = Number(search);
  const orConditions: any[] = [];
  
  if (search) {
    orConditions.push({ code: { contains: search, mode: 'insensitive' } });
    if (!isNaN(numSearch)) {
      orConditions.push({ thicknessMm: { equals: numSearch } });
    }
  }

  const data = await prisma.glassThickness.findMany({
    ...(orConditions.length > 0 && {
      where: { OR: orConditions },
    }),
    orderBy: { createdAt: 'desc' },
  });
  res.json({ data });
});

adminMastersRouter.post('/glass-thickness', async (req, res) => {
  const parsed = glassThicknessSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid payload', errors: parsed.error.flatten() });
    return;
  }
  const cleanData = Object.fromEntries(
    Object.entries(parsed.data).filter(([_, v]) => v !== undefined)
  );
  const created = await prisma.glassThickness.create({ data: cleanData as any });
  res.status(201).json(created);
});

adminMastersRouter.patch('/glass-thickness/:id', async (req, res) => {
  const parsed = updateGlassThicknessSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid payload', errors: parsed.error.flatten() });
    return;
  }
  const cleanData = Object.fromEntries(
    Object.entries(parsed.data).filter(([_, v]) => v !== undefined)
  );
  const updated = await prisma.glassThickness.update({
    where: { id: req.params.id },
    data: cleanData,
  });
  res.json(updated);
});

adminMastersRouter.get('/brands', async (req, res) => {
  const search = searchQuery(req);
  const data = await prisma.brand.findMany({
    ...(search && {
      where: {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { code: { contains: search, mode: 'insensitive' } },
        ],
      },
    }),
    orderBy: { createdAt: 'desc' },
  });
  res.json({ data });
});

adminMastersRouter.post('/brands', async (req, res) => {
  const parsed = baseSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid payload', errors: parsed.error.flatten() });
    return;
  }
  const cleanData = Object.fromEntries(
    Object.entries(parsed.data).filter(([_, v]) => v !== undefined)
  );
  const created = await prisma.brand.create({ data: cleanData as any });
  res.status(201).json(created);
});

adminMastersRouter.patch('/brands/:id', async (req, res) => {
  const parsed = updateBaseSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid payload', errors: parsed.error.flatten() });
    return;
  }
  const cleanData = Object.fromEntries(
    Object.entries(parsed.data).filter(([_, v]) => v !== undefined)
  );
  const updated = await prisma.brand.update({
    where: { id: req.params.id },
    data: cleanData,
  });
  res.json(updated);
});
