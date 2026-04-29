import { Router } from 'express';
import { z } from 'zod';

import { prisma } from '../prisma';
import { requireAuth } from '../middleware/auth';

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
  price: z.coerce.number().optional(),
  /** When true, never merge into an existing IN_CART row (same product/color/brand). */
  skipCartDedupe: z.boolean().optional(),
  /** Admin only: create/find default cart project for this user instead of the caller. Ignored when projectId is set. */
  cartOwnerUserId: z.string().uuid().optional(),
});

export const cartRouter = Router();
cartRouter.use(requireAuth, (req, res, next) => {
  const role = req.auth?.role;
  if (!role || !['admin', 'tech', 'user'].includes(role)) {
    res.status(403).json({ message: 'Forbidden' });
    return;
  }
  next();
});

// Get all cart items for current user
cartRouter.get('/', async (req, res) => {
  const userId = req.auth?.userId;
  if (!userId) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const isAdmin = req.auth?.role === 'admin';

  const cartItems = await prisma.projectItem.findMany({
    where: {
      status: 'IN_CART',
      project: isAdmin
        ? {
            OR: [
              { createdById: userId },
              { createdBy: { role: { in: ['tech', 'user'] } } }
            ]
          }
        : { createdById: userId }
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
          taxId: true,
          houseNo: true,
          moo: true,
          building: true,
          soi: true,
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
    unitPrice: item.price != null
      ? parseFloat(item.price.toString())
      : (item.product?.priceManual ? parseFloat(item.product.priceManual.toString()) : 0)
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
  const { projectId: rawProjectId, skipCartDedupe, cartOwnerUserId, ...itemData } = parsed.data;

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
    let cartUserId = userId;
    if (cartOwnerUserId) {
      if (req.auth?.role !== 'admin') {
        res.status(403).json({ message: 'Forbidden' });
        return;
      }
      const owner = await prisma.user.findUnique({
        where: { id: cartOwnerUserId },
        select: { id: true },
      });
      if (!owner) {
        res.status(404).json({ message: 'Cart owner user not found' });
        return;
      }
      cartUserId = cartOwnerUserId;
    }

    // Auto-find or create a default cart project for cartUserId
    const user = await prisma.user.findUnique({
      where: { id: cartUserId },
      select: { id: true, email: true, phone: true },
    });
    const defaultName = 'ตะกร้าสินค้า';
    project = await prisma.project.findFirst({
      where: { createdById: cartUserId, name: defaultName, status: 'draft' },
    });
    if (!project) {
      project = await prisma.project.create({
        data: {
          name: defaultName,
          customerName: user?.email ?? 'ลูกค้า',
          phone: user?.phone ?? '0000000000',
          createdById: cartUserId,
        },
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

  // If same product (+ color + brand) already exists in cart, increment qty (unless skipped)
  if (!skipCartDedupe) {
    const existing = await prisma.projectItem.findFirst({
      where: {
        projectId,
        productId: itemData.productId,
        colorId: itemData.colorId ?? null,
        brandId: itemData.brandId ?? null,
        status: 'IN_CART',
      },
    });

    if (existing) {
      const updated = await prisma.projectItem.update({
        where: { id: existing.id },
        data: { quantity: (existing.quantity ?? 0) + itemData.quantity },
        include: { product: true, brand: true, color: true, formula: true },
      });
      res.json(updated);
      return;
    }
  }

  // Create new cart item
  const cartItem = await prisma.projectItem.create({
    data: {
      projectId,
      status: 'IN_CART',
      productId: itemData.productId,
      quantity: itemData.quantity,
      formulaId: formulaId,
      colorId: itemData.colorId || null,
      brandId: itemData.brandId || null,
      width: itemData.width ?? null,
      height: itemData.height ?? null,
      length: itemData.length ?? null,
      panelCount: itemData.panelCount ?? null,
      unit: itemData.unit ?? null,
      glassTypeId: itemData.glassTypeId || null,
      glassThicknessId: itemData.glassThicknessId || null,
      glassWidth: itemData.glassWidth ?? null,
      glassHeight: itemData.glassHeight ?? null,
      glassThicknessMm: itemData.glassThicknessMm ?? null,
      glassQuantity: itemData.glassQuantity ?? null,
      price: itemData.price ?? null
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
