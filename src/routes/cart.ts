import { Router } from 'express';
import { z } from 'zod';

import { prisma } from '../prisma';
import { requireAuth } from '../middleware/auth';
import { requireRoleOrAdmin } from '../middleware/roles';

const cartItemSchema = z.object({
  projectId: z.string().optional(),
  productId: z.string(),
  formulaId: z.string().optional(),
  colorId: z.string().optional(),
  brandId: z.string().optional(),
  width: z.coerce.number().int().optional(),
  height: z.coerce.number().int().optional(),
  length: z.coerce.number().int().optional(),
  panelCount: z.coerce.number().int().optional(),
  quantity: z.coerce.number().int().default(1),
  unit: z.string().optional(),
  glassTypeId: z.string().optional(),
  glassThicknessId: z.string().optional(),
  glassWidth: z.coerce.number().int().optional(),
  glassHeight: z.coerce.number().int().optional(),
  glassThicknessMm: z.coerce.number().optional(),
  glassQuantity: z.coerce.number().int().optional(),
});

export const cartRouter = Router();
cartRouter.use(requireAuth, requireRoleOrAdmin('tech'));

// Get all cart items for current user
cartRouter.get('/', async (req, res) => {
  const userId = req.auth?.userId;
  if (!userId) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const cartItems = await prisma.projectItem.findMany({
    where: {
      status: 'IN_CART',
      project: {
        createdById: userId
      }
    },
    include: {
      product: true,
      brand: true,
      color: true,
      formula: true,
      project: {
        select: {
          id: true,
          name: true,
          code: true,
          phone: true,
          customerName: true,
          houseNo: true,
          moo: true,
          road: true,
          province: true,
          district: true,
          subdistrict: true,
          postalCode: true
        }
      }
    }
  });

  // Add calculated unitPrice to each item
  const itemsWithPrice = cartItems.map(item => ({
    ...item,
    unitPrice: item.product?.priceManual ? parseFloat(item.product.priceManual.toString()) : 0
    // TODO: Calculate from formula if priceSource is FORMULA
  }));

  res.json({ data: itemsWithPrice });
});

// Add item to cart
cartRouter.post('/', async (req, res) => {
  const parsed = cartItemSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid payload', errors: parsed.error.flatten() });
    return;
  }

  const userId = req.auth?.userId!;
  const { projectId: rawProjectId, ...itemData } = parsed.data;

  let project: { id: string; createdById: string } | null = null;

  if (rawProjectId) {
    // Use provided project
    project = await prisma.project.findUnique({ where: { id: rawProjectId } });
    if (!project) {
      res.status(404).json({ message: 'Project not found' });
      return;
    }
    if (req.auth?.role !== 'admin' && project.createdById !== userId) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }
  } else {
    // Auto-find or create a default cart project for this user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, phone: true }
    });
    const defaultName = 'ตะกร้าสินค้า';
    project = await prisma.project.findFirst({
      where: { createdById: userId, name: defaultName, status: 'draft' }
    });
    if (!project) {
      project = await prisma.project.create({
        data: {
          name: defaultName,
          customerName: user?.email ?? 'ลูกค้า',
          phone: user?.phone ?? '0000000000',
          createdById: userId,
        }
      });
    }
  }

  const projectId = project.id;

  // Auto-fill formulaId from product if not provided
  let formulaId = itemData.formulaId ?? null;
  if (!formulaId && itemData.productId) {
    const product = await prisma.product.findUnique({
      where: { id: itemData.productId },
      select: { formulaId: true }
    });
    if (product?.formulaId) {
      formulaId = product.formulaId;
    }
  }

  // Create cart item
  const cartItem = await prisma.projectItem.create({
    data: {
      projectId,
      status: 'IN_CART',
      productId: itemData.productId,
      quantity: itemData.quantity,
      formulaId: formulaId,
      colorId: itemData.colorId ?? null,
      brandId: itemData.brandId ?? null,
      width: itemData.width ?? null,
      height: itemData.height ?? null,
      length: itemData.length ?? null,
      panelCount: itemData.panelCount ?? null,
      unit: itemData.unit ?? null,
      glassTypeId: itemData.glassTypeId ?? null,
      glassThicknessId: itemData.glassThicknessId ?? null,
      glassWidth: itemData.glassWidth ?? null,
      glassHeight: itemData.glassHeight ?? null,
      glassThicknessMm: itemData.glassThicknessMm ?? null,
      glassQuantity: itemData.glassQuantity ?? null
    },
    include: {
      product: true,
      brand: true,
      color: true,
      formula: true
    }
  });

  res.status(201).json(cartItem);
});

// Update cart item quantity
cartRouter.patch('/:id', async (req, res) => {
  const { quantity } = req.body;
  const userId = req.auth?.userId;
  if (!userId) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const item = await prisma.projectItem.findUnique({
    where: { id: req.params.id },
    include: { project: true }
  });

  if (!item) {
    res.status(404).json({ message: 'Cart item not found' });
    return;
  }

  if (item.status !== 'IN_CART') {
    res.status(400).json({ message: 'Item is not in cart' });
    return;
  }

  if (req.auth?.role !== 'admin' && item.project.createdById !== userId) {
    res.status(403).json({ message: 'Forbidden' });
    return;
  }

  const updated = await prisma.projectItem.update({
    where: { id: req.params.id },
    data: { quantity: quantity || item.quantity },
    include: {
      product: true,
      brand: true,
      color: true,
      formula: true
    }
  });

  res.json(updated);
});

// Remove item from cart
cartRouter.delete('/:id', async (req, res) => {
  const userId = req.auth?.userId;
  if (!userId) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const item = await prisma.projectItem.findUnique({
    where: { id: req.params.id },
    include: { project: true }
  });

  if (!item) {
    res.status(404).json({ message: 'Cart item not found' });
    return;
  }

  if (item.status !== 'IN_CART') {
    res.status(400).json({ message: 'Item is not in cart' });
    return;
  }

  if (req.auth?.role !== 'admin' && item.project.createdById !== userId) {
    res.status(403).json({ message: 'Forbidden' });
    return;
  }

  await prisma.projectItem.delete({
    where: { id: req.params.id }
  });

  res.json({ message: 'Cart item removed' });
});

// Clear all cart items
cartRouter.delete('/', async (req, res) => {
  const userId = req.auth?.userId;
  if (!userId) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  await prisma.projectItem.deleteMany({
    where: {
      status: 'IN_CART',
      project: {
        createdById: userId
      }
    }
  });

  res.json({ message: 'Cart cleared' });
});
