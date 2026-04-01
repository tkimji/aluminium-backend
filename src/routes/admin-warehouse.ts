import { Router } from 'express';
import { z } from 'zod';

import { prisma } from '../prisma';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/roles';

const warehouseSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  status: z.enum(['active', 'inactive']).optional(),
});

const warehouseUpdateSchema = warehouseSchema.partial().extend({
  code: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
});

const inventoryAdjustSchema = z.object({
  productId: z.string().min(1),
  warehouseId: z.string().min(1),
  qtyChange: z.coerce.number().int(),
  lowStockThreshold: z.coerce.number().int().min(0).optional(),
});

const stockMovementSchema = z.object({
  warehouseId: z.string().min(1),
  productId: z.string().min(1),
  type: z.enum(['IN', 'OUT', 'ADJUSTMENT']),
  quantity: z.coerce.number().int().min(1),
  reference: z.string().optional(),
  note: z.string().optional(),
});

export const adminWarehouseRouter = Router();
adminWarehouseRouter.use(requireAuth, requireRole('admin'));

adminWarehouseRouter.get('/warehouses', async (_req, res) => {
  const data = await prisma.warehouse.findMany({
    orderBy: { createdAt: 'desc' },
  });
  res.json({ data });
});

// GET /admin/warehouses/:warehouseId/products/:productId — inventory row + product (for admin product detail)
adminWarehouseRouter.get('/warehouses/:warehouseId/products/:productId', async (req, res) => {
  const warehouseId = req.params.warehouseId as string;
  const productId = req.params.productId as string;

  const warehouse = await prisma.warehouse.findUnique({ where: { id: warehouseId } });
  if (!warehouse) {
    res.status(404).json({ message: 'Warehouse not found' });
    return;
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { productType: true, unit: true, brand: true },
  });
  if (!product) {
    res.status(404).json({ message: 'Product not found' });
    return;
  }

  const inventoryRow = await prisma.inventory.findFirst({
    where: { warehouseId, productId },
    include: {
      product: {
        include: { productType: true, unit: true, brand: true },
      },
    },
  });

  if (inventoryRow) {
    res.json({ data: inventoryRow });
    return;
  }

  res.json({
    data: {
      id: null,
      warehouseId,
      productId,
      qtyOnHand: 0,
      lowStockThreshold: 0,
      product,
    },
  });
});

adminWarehouseRouter.get('/warehouses/:id', async (req, res) => {
  const warehouse = await prisma.warehouse.findUnique({
    where: { id: req.params.id as string },
    include: {
      inventory: {
        include: { product: { include: { productType: true, unit: true, brand: true } } },
        orderBy: { updatedAt: 'desc' },
      },
      stockMovements: {
        include: { product: true },
        orderBy: { createdAt: 'desc' },
        take: 50,
      },
    },
  });

  if (!warehouse) {
    res.status(404).json({ message: 'Warehouse not found' });
    return;
  }

  res.json({ data: warehouse });
});

adminWarehouseRouter.post('/warehouses', async (req, res) => {
  const parsed = warehouseSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid payload', errors: parsed.error.flatten() });
    return;
  }

  const cleanData = Object.fromEntries(
    Object.entries(parsed.data).filter(([_, v]) => v !== undefined)
  );
  const created = await prisma.warehouse.create({ data: cleanData as any });
  res.status(201).json(created);
});

adminWarehouseRouter.patch('/warehouses/:id', async (req, res) => {
  const parsed = warehouseUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid payload', errors: parsed.error.flatten() });
    return;
  }

  const cleanData = Object.fromEntries(
    Object.entries(parsed.data).filter(([_, v]) => v !== undefined)
  );

  const updated = await prisma.warehouse.update({
    where: { id: req.params.id },
    data: cleanData,
  });

  res.json(updated);
});

adminWarehouseRouter.get('/inventory', async (req, res) => {
  const search = String(req.query.search ?? '').trim();
  const data = await prisma.inventory.findMany({
    ...(search && {
      where: {
        product: {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { sku: { contains: search, mode: 'insensitive' } },
          ],
        },
      },
    }),
    include: { product: true, warehouse: true },
    orderBy: { updatedAt: 'desc' },
  });
  res.json({ data });
});

adminWarehouseRouter.post('/inventory/adjust', async (req, res) => {
  const parsed = inventoryAdjustSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid payload', errors: parsed.error.flatten() });
    return;
  }

  const { productId, warehouseId, qtyChange, lowStockThreshold } = parsed.data;

  const existing = await prisma.inventory.findFirst({
    where: { productId, warehouseId },
  });

  const updated = existing
    ? await prisma.inventory.update({
        where: { id: existing.id },
        data: {
          qtyOnHand: existing.qtyOnHand + qtyChange,
          ...(lowStockThreshold !== undefined && { lowStockThreshold }),
        },
      })
    : await prisma.inventory.create({
        data: {
          productId,
          warehouseId,
          qtyOnHand: qtyChange,
          lowStockThreshold: lowStockThreshold ?? 5,
        },
      });

  res.json(updated);
});

adminWarehouseRouter.get('/inventory/low-stock', async (_req, res) => {
  const data = await prisma.inventory.findMany({
    include: { product: true, warehouse: true },
    orderBy: { updatedAt: 'desc' },
  });

  const filtered = data.filter((item) => item.qtyOnHand <= item.lowStockThreshold);

  res.json({ data: filtered });
});

// GET /admin/warehouses/:id/inventory - Get products in specific warehouse
adminWarehouseRouter.get('/warehouses/:id/inventory', async (req, res) => {
  try {
    const inventory = await prisma.inventory.findMany({
      where: { warehouseId: req.params.id },
      include: {
        product: {
          include: {
            productType: true,
            unit: true,
            brand: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    res.json({ data: inventory });
  } catch (error) {
    console.error('Error fetching warehouse inventory:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /admin/stock-movements - Record stock movement (IN/OUT)
adminWarehouseRouter.post('/stock-movements', async (req, res) => {
  try {
    const parsed = stockMovementSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: 'Invalid payload', errors: parsed.error.flatten() });
      return;
    }

    const { warehouseId, productId, type, quantity, reference, note } = parsed.data;

    // Verify warehouse exists
    const warehouse = await prisma.warehouse.findUnique({
      where: { id: warehouseId }
    });

    if (!warehouse) {
      res.status(404).json({ message: `Warehouse not found: ${warehouseId}` });
      return;
    }

    // Verify product exists
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      res.status(404).json({ message: `Product not found: ${productId}` });
      return;
    }

    // Calculate quantity change based on type
    const qtyChange = type === 'OUT' ? -quantity : quantity;

    // Record stock movement
    const movement = await prisma.stockMovement.create({
      data: {
        warehouseId,
        productId,
        type,
        quantity,
        reference: reference ?? null,
        note: note ?? null,
        createdBy: req.auth?.userId ?? null,
      }
    });

    // Update inventory
    const existing = await prisma.inventory.findFirst({
      where: { productId, warehouseId }
    });

    const updated = existing
      ? await prisma.inventory.update({
          where: { id: existing.id },
          data: { qtyOnHand: existing.qtyOnHand + qtyChange }
        })
      : await prisma.inventory.create({
          data: {
            productId,
            warehouseId,
            qtyOnHand: Math.max(0, qtyChange)
          }
        });

    res.status(201).json({
      movement,
      inventory: updated
    });
  } catch (error) {
    console.error('Error creating stock movement:', error);
    console.error('Request body:', req.body);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /admin/stock-movements - Get stock movement history
adminWarehouseRouter.get('/stock-movements', async (req, res) => {
  try {
    const { warehouseId, productId, type } = req.query;

    const where: any = {};
    if (warehouseId) where.warehouseId = String(warehouseId);
    if (productId) where.productId = String(productId);
    if (type) where.type = String(type);

    const movements = await prisma.stockMovement.findMany({
      where,
      include: {
        product: true,
        warehouse: true,
        user: {
          select: {
            email: true,
            profile: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    res.json({ data: movements });
  } catch (error) {
    console.error('Error fetching stock movements:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});
