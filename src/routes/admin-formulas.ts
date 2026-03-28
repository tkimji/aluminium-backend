import { Router } from 'express';
import { z } from 'zod';

import { prisma } from '../prisma';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/roles';

const formulaItemSchema = z.object({
  aluminiumItemId: z.string().min(1),
  position: z.string().optional(),
  lengthMm: z.coerce.number().int().min(1),
  qty: z.coerce.number().int().min(1),
  totalLengthMm: z.coerce.number().int().optional(),
  angle: z.string().optional(),
});

const formulaSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  sequenceNumber: z.coerce.number().int().optional(),
  productionQuantity: z.coerce.number().int().optional(),
  productTypeId: z.string().optional(),
  unitId: z.string().optional(),
  standardWidth: z.coerce.number().int().min(1),
  standardHeight: z.coerce.number().int().min(1),
  standardLength: z.coerce.number().int().min(1),
  glassTypeId: z.string().optional(),
  glassThicknessId: z.string().optional(),
  modelPath: z.string().optional(),
  items: z.array(formulaItemSchema).optional(),
});

const formulaUpdateSchema = formulaSchema.partial().extend({
  code: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  standardWidth: z.coerce.number().int().min(1).optional(),
  standardHeight: z.coerce.number().int().min(1).optional(),
  standardLength: z.coerce.number().int().min(1).optional(),
});

export const adminFormulasRouter = Router();
adminFormulasRouter.use(requireAuth, requireRole(['admin', 'tech']));

adminFormulasRouter.get('/formulas', async (req, res) => {
  const search = String(req.query.search ?? '').trim();
  const data = await prisma.formula.findMany({
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

adminFormulasRouter.post('/formulas', async (req, res) => {
  const parsed = formulaSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid payload', errors: parsed.error.flatten() });
    return;
  }

  const { glassTypeId, glassThicknessId, productTypeId, unitId, items, ...rest } = parsed.data;
  
  const created = await prisma.formula.create({
    data: {
      ...rest,
      ...(glassTypeId && { glassTypeId }),
      ...(glassThicknessId && { glassThicknessId }),
      ...(productTypeId && { productTypeId }),
      ...(unitId && { unitId }),
      ...(items && items.length > 0 && {
        items: {
          create: items.map(item => ({
            aluminiumItemId: item.aluminiumItemId,
            position: item.position,
            lengthMm: item.lengthMm,
            qty: item.qty,
            totalLengthMm: item.totalLengthMm,
            angle: item.angle,
          }))
        }
      }),
    },
    include: { items: true },
  });
  res.status(201).json(created);
});

adminFormulasRouter.get('/formulas/:id', async (req, res) => {
  const formula = await prisma.formula.findUnique({
    where: { id: req.params.id },
    include: { 
      items: {
        include: {
          aluminiumItem: true
        }
      },
      productType: true,
      unit: true,
      glassType: true,
      glassThickness: true,
    },
  });

  if (!formula) {
    res.status(404).json({ message: 'Formula not found' });
    return;
  }

  res.json(formula);
});

adminFormulasRouter.patch('/formulas/:id', async (req, res) => {
  const parsed = formulaUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid payload', errors: parsed.error.flatten() });
    return;
  }

  const { items, ...otherData } = parsed.data;
  const cleanData = Object.fromEntries(
    Object.entries(otherData).filter(([_, v]) => v !== undefined)
  );

  // Update formula and handle items separately
  const updated = await prisma.formula.update({
    where: { id: req.params.id },
    data: cleanData,
  });

  // If items are provided, delete old ones and create new ones
  if (items && items.length > 0) {
    await prisma.formulaItem.deleteMany({
      where: { formulaId: req.params.id }
    });
    
    await prisma.formulaItem.createMany({
      data: items.map(item => ({
        formulaId: req.params.id,
        aluminiumItemId: item.aluminiumItemId,
        position: item.position,
        lengthMm: item.lengthMm,
        qty: item.qty,
        totalLengthMm: item.totalLengthMm,
        angle: item.angle,
      }))
    });
  }

  // Fetch updated formula with items
  const result = await prisma.formula.findUnique({
    where: { id: req.params.id },
    include: { items: true },
  });

  res.json(result);
});

adminFormulasRouter.post('/formulas/:id/items', async (req, res) => {
  const parsed = formulaItemSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid payload', errors: parsed.error.flatten() });
    return;
  }

  const formula = await prisma.formula.findUnique({ where: { id: req.params.id } });
  if (!formula) {
    res.status(404).json({ message: 'Formula not found' });
    return;
  }

  const cleanData = Object.fromEntries(
    Object.entries(parsed.data).filter(([_, v]) => v !== undefined)
  ) as Partial<z.infer<typeof formulaItemSchema>>;

  const created = await prisma.formulaItem.create({
    data: {
      formulaId: formula.id,
      ...cleanData,
    } as any,
  });

  res.status(201).json(created);
});

adminFormulasRouter.patch('/formulas/:id/items/:itemId', async (req, res) => {
  const parsed = formulaItemSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid payload', errors: parsed.error.flatten() });
    return;
  }

  const item = await prisma.formulaItem.findUnique({ where: { id: req.params.itemId } });
  if (!item || item.formulaId !== req.params.id) {
    res.status(404).json({ message: 'Formula item not found' });
    return;
  }

  const cleanData = Object.fromEntries(
    Object.entries(parsed.data).filter(([_, v]) => v !== undefined)
  );

  const updated = await prisma.formulaItem.update({
    where: { id: item.id },
    data: cleanData,
  });

  res.json(updated);
});

adminFormulasRouter.delete('/formulas/:id/items/:itemId', async (req, res) => {
  const item = await prisma.formulaItem.findUnique({ where: { id: req.params.itemId } });
  if (!item || item.formulaId !== req.params.id) {
    res.status(404).json({ message: 'Formula item not found' });
    return;
  }

  await prisma.formulaItem.delete({ where: { id: item.id } });
  res.status(204).send();
});
