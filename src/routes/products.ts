import { Router } from 'express';

import { prisma } from '../prisma';
import { requireAuth } from '../middleware/auth';

export const productsRouter = Router();
productsRouter.use(requireAuth);

productsRouter.get('/', async (req, res) => {
  const search = String(req.query.search ?? '').trim();
  const itemFormat = req.query.itemFormat ? String(req.query.itemFormat) : undefined;

  const where: any = {};
  if (itemFormat) where.itemFormat = itemFormat;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { sku: { contains: search, mode: 'insensitive' } },
    ];
  }

  const data = await prisma.product.findMany({
    where,
    include: {
      brand: true,
      productType: true,
      unit: true,
      formula: {
        include: {
          glassType: true,
          glassThickness: true
        }
      }
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ data });
});

productsRouter.get('/brands', async (req, res) => {
  const data = await prisma.brand.findMany({
    orderBy: { name: 'asc' }
  });
  res.json({ data });
});

productsRouter.get('/colors', async (req, res) => {
  const data = await prisma.color.findMany({
    orderBy: { name: 'asc' }
  });
  res.json({ data });
});
