import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { z } from 'zod';

import { prisma } from '../prisma';
import { logger } from '../logger';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/roles';

const uploadDir = path.join(process.cwd(), 'uploads', 'products');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const productImageStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${req.params.id}-${Date.now()}${ext}`);
  },
});

const productImageUpload = multer({
  storage: productImageStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

function bodyForLog(body: unknown): Record<string, unknown> {
  if (!body || typeof body !== 'object') return {};
  const o = { ...(body as Record<string, unknown>) };
  const img = o.imageUrl;
  if (typeof img === 'string' && img.length > 100) {
    o.imageUrl = `[truncated ${img.length} chars]`;
  }
  return o;
}

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
  formulaId: z
    .union([z.string(), z.null()])
    .optional()
    .transform((v) => (v === '' || v === null) ? null : v),
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
      formulaId: formulaId ?? null,
      ...(status && { status }),
      ...(description && { description }),
      ...(imageUrl && { imageUrl }),
    },
  });

  res.status(201).json(created);
});

adminProductsRouter.patch('/products/:id', async (req, res) => {
  const productId = req.params.id;
  logger.info(
    `PATCH /admin/products/${productId} rawBody=${JSON.stringify(bodyForLog(req.body))}`
  );

  const parsed = productUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    logger.warn(
      `PATCH /admin/products/${productId} validation failed ${JSON.stringify(parsed.error.flatten())}`
    );
    res.status(400).json({ message: 'Invalid payload', errors: parsed.error.flatten() });
    return;
  }

  const cleanData: Record<string, unknown> = Object.fromEntries(
    Object.entries(parsed.data).filter(([_, v]) => v !== undefined)
  );

  // Empty-string FK → null so Prisma doesn't try to reference a non-existent row
  if (cleanData.formulaId === '') cleanData.formulaId = null;

  

  const updated = await prisma.product.update({
    where: { id: productId },
    data: cleanData,
  });

  //logger.info(`PATCH /admin/products/${productId} ok sku=${updated.sku}`);
  res.json(updated);
});

adminProductsRouter.post('/products/:id/image', productImageUpload.single('image'), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ message: 'File is required' });
    return;
  }

  const productId = String(req.params.id);
  const imageUrl = `/uploads/products/${req.file.filename}`;

  const updated = await prisma.product.update({
    where: { id: productId },
    data: { imageUrl },
  });

  logger.info(`POST /admin/products/${productId}/image saved ${imageUrl}`);
  res.json({ imageUrl: updated.imageUrl });
});
