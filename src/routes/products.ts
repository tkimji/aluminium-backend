import { Router } from 'express';

import { prisma } from '../prisma';
import { logger } from '../logger';
export const productsRouter = Router();

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
  where.AND=[{status: 'active'}];
  //logger.info(`where: ${JSON.stringify(where)}`);

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

productsRouter.get('/glass-types', async (_req, res) => {
  //glassType
  const data = await prisma.glassType.findMany({
    orderBy: { name: 'asc' },
  });
  res.json({ data });
});

productsRouter.get('/:id', async (req, res) => {
  const product = await prisma.product.findFirst({
    where: { id: req.params.id, status: 'active' },
    include: {
      brand: true,
      productType: true,
      unit: true,
      formula: {
        include: {
          glassType: true,
          glassThickness: true,
        },
      },
    },
  });

  if (!product) {
    res.status(404).json({ message: 'Product not found' });
    return;
  }

  res.json({ data: product });
});
