import { Router } from 'express';
import { z } from 'zod';

import { prisma } from '../prisma';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/roles';

const itemFormatEnum = z.enum(['MTO', 'PRESET', 'MATERIAL']);
const priceSourceEnum = z.enum(['MANUAL', 'FORMULA']);

const productSchema = z.object({
  sku: z.string().min(1),
  name: z.string().min(1),
  itemFormat: itemFormatEnum,
  productTypeId: z.string().min(1),
  unitId: z.string().min(1),
  brandId: z.string().optional(),
  warehouseId: z.string().optional(),
  priceManual: z.coerce.number().optional(),
  priceSource: priceSourceEnum.optional(),
  formulaId: z.string().optional(),
  status: z.enum(['active', 'inactive']).optional(),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
});

const productUpdateSchema = productSchema.partial().extend({
  sku: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
});

export const adminProductsRouter = Router();
adminProductsRouter.use(requireAuth, requireRole('admin'));

adminProductsRouter.get('/products', async (req, res) => {
  const search = String(req.query.search ?? '').trim();
  const data = await prisma.product.findMany({
    ...(search && {
      where: {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } },
        ],
      },
    }),
    orderBy: { createdAt: 'desc' },
  });

  res.json({ data });
});

adminProductsRouter.get('/products/:id', async (req, res) => {
  const product = await prisma.product.findUnique({
    where: { id: req.params.id },
    include: {
      productType: true,
      unit: true,
      brand: true,
      warehouse: true,
      formula: true
    }
  });

  if (!product) {
    res.status(404).json({ message: 'Product not found' });
    return;
  }

  res.json({ data: product });
});

adminProductsRouter.post('/products', async (req, res) => {
  const parsed = productSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid payload', errors: parsed.error.flatten() });
    return;
  }

  const { brandId, warehouseId, priceManual, priceSource, formulaId, status, description, imageUrl, ...required } = parsed.data;
  const created = await prisma.product.create({
    data: {
      ...required,
      ...(brandId && { brandId }),
      ...(warehouseId && { warehouseId }),
      ...(priceManual !== undefined && { priceManual }),
      priceSource: priceSource ?? 'MANUAL',
      ...(formulaId && { formulaId }),
      ...(status && { status }),
      ...(description && { description }),
      ...(imageUrl && { imageUrl }),
    },
  });

  res.status(201).json(created);
});

adminProductsRouter.patch('/products/:id', async (req, res) => {
  const parsed = productUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid payload', errors: parsed.error.flatten() });
    return;
  }

  const cleanData = Object.fromEntries(
    Object.entries(parsed.data).filter(([_, v]) => v !== undefined)
  );

  const updated = await prisma.product.update({
    where: { id: req.params.id },
    data: cleanData,
  });

  res.json(updated);
});
