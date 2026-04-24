import { Router } from 'express';
import { z } from 'zod';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

import { prisma } from '../prisma';
import { requireAuth } from '../middleware/auth';

const shippingSchema = z.object({
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

const orderCreateSchema = z.object({
  projectId: z.string().optional(),
  code: z.string().optional(),
  /** Required when projectId is omitted (e.g. end-user checkout without a project). */
  shipping: shippingSchema.optional(),
  items: z
    .array(
      z.object({
        productId: z.string(),
        colorId: z.string().nullable().optional(),
        brandId: z.string().nullable().optional(),
        width: z.coerce.number().nullable().optional(),
        height: z.coerce.number().nullable().optional(),
        thickness: z.coerce.number().nullable().optional(),
        qty: z.coerce.number().int().min(1),
        unitPrice: z.coerce.number().min(0),
      })
    )
    .min(1),
  etax: z.object({
    legalName: z.string(),
    taxId: z.string(),
    houseNo: z.string().optional(),
    moo: z.string().optional(),
    road: z.string().optional(),
    province: z.string().optional(),
    district: z.string().optional(),
    subdistrict: z.string().optional(),
    postalCode: z.string().optional(),
  }).optional(),
});

const paymentSchema = z.object({
  slipUrl: z.string().min(1),
});

// Setup multer for file uploads
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/\s+/g, '-');
    const stamp = Date.now();
    cb(null, `payment-slip-${stamp}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

export const ordersRouter = Router();
ordersRouter.use(requireAuth);

ordersRouter.get('/', async (req, res) => {
  const role = req.auth?.role;
  const userId = req.auth?.userId;

  const where: any =
    role !== 'admin' && userId
      ? {
          OR: [{ project: { createdById: userId } }, { customerUserId: userId }],
        }
      : {};

  const data = await prisma.order.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: { 
      items: true,
      project: true,
      payments: true
    },
  });

  res.json({ data });
});

ordersRouter.post('/', async (req, res) => {
  const parsed = orderCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid payload', errors: parsed.error.flatten() });
    return;
  }

  if (req.auth?.role !== 'admin' && req.auth?.role !== 'tech' && req.auth?.role !== 'user') {
    res.status(403).json({ message: 'Forbidden' });
    return;
  }

  const payload = parsed.data;

  if (!payload.projectId) {
    const s = payload.shipping;
    const hasCore =
      s &&
      (s.province ?? '').trim() &&
      (s.district ?? '').trim() &&
      (s.subdistrict ?? '').trim();
    if (!hasCore) {
      res.status(400).json({
        message: 'shipping (province, district, subdistrict) is required when projectId is omitted',
      });
      return;
    }
  }

  if (payload.projectId) {
    const project = await prisma.project.findUnique({ where: { id: payload.projectId } });
    if (!project) {
      res.status(404).json({ message: 'Project not found' });
      return;
    }

    if (req.auth?.role !== 'admin' && project.createdById !== req.auth?.userId) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }
  }

  const code = payload.code ?? `OD${Date.now()}`;

  const orderData: any = {
    code,
    items: {
      create: payload.items.map((item) => ({
        productId: item.productId,
        colorId: item.colorId,
        brandId: item.brandId,
        width: item.width,
        height: item.height,
        thickness: item.thickness,
        qty: item.qty,
        unitPrice: item.unitPrice,
        totalPrice: item.unitPrice * item.qty,
      })),
    },
  };
  if (payload.projectId) {
    orderData.projectId = payload.projectId;
  } else if (req.auth?.userId) {
    orderData.customerUserId = req.auth.userId;
    const sh = payload.shipping!;
    orderData.shipHouseNo = sh.houseNo ?? null;
    orderData.shipMoo = sh.moo ?? null;
    orderData.shipBuilding = sh.building ?? null;
    orderData.shipSoi = sh.soi ?? null;
    orderData.shipRoad = sh.road ?? null;
    orderData.shipProvince = sh.province ?? null;
    orderData.shipDistrict = sh.district ?? null;
    orderData.shipSubdistrict = sh.subdistrict ?? null;
    orderData.shipPostalCode = sh.postalCode ?? null;
  }
  
  // Add e-tax if provided
  if (payload.etax) {
    orderData.etax = {
      create: {
        legalName: payload.etax.legalName,
        taxId: payload.etax.taxId,
        houseNo: payload.etax.houseNo,
        moo: payload.etax.moo,
        road: payload.etax.road,
        province: payload.etax.province,
        district: payload.etax.district,
        subdistrict: payload.etax.subdistrict,
        postalCode: payload.etax.postalCode,
      }
    };
  }

  const order = await prisma.order.create({
    data: orderData,
    include: { items: true, etax: true },
  });

  if (payload.projectId) {
    await prisma.project.update({
      where: { id: payload.projectId },
      data: { status: 'ordered' },
    });
  }

  res.status(201).json(order);
});

ordersRouter.patch('/:id/:status', async (req, res) => {
  if (req.auth?.role !== 'admin') {
    res.status(403).json({ message: 'Forbidden: admin only' });
    return;
  }

  const validStatuses = ['awaiting_payment', 'verifying', 'paid', 'preparing', 'shipped', 'completed', 'cancelled'];
  const { status } = req.params;

  if (!validStatuses.includes(status)) {
    res.status(400).json({ message: 'Invalid status', validStatuses });
    return;
  }

  const existing = await prisma.order.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    res.status(404).json({ message: 'Order not found' });
    return;
  }

  const updated = await prisma.order.update({
    where: { id: req.params.id },
    data: { status: status as any },
  });

  res.json({ message: 'Status updated', data: updated });
});

ordersRouter.get('/:id', async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: {
      items: {
        include: {
          product: {
            include: {
              formula: true,
              brand: true,
              productType: true,
            },
          },
          color: true,
          brand: true,
        },
      },
      project: true,
      customerUser: { select: { id: true, email: true, phone: true } },
      payments: true,
      etax: true,
    },
  });

  if (!order) {
    res.status(404).json({ message: 'Order not found' });
    return;
  }

  // Admin can view any order
  if (req.auth?.role === 'admin') {
    res.json(order);
    return;
  }

  // For tech/user: must own the project, or be the customer on a project-less order
  if (req.auth?.role !== 'admin') {
    const uid = req.auth?.userId;
    if (order.project) {
      if (order.project.createdById !== uid) {
        res.status(403).json({ message: 'Forbidden' });
        return;
      }
    } else if (order.customerUserId !== uid) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }
  }

  res.json(order);
});

ordersRouter.post('/:id/payments', upload.single('file'), async (req, res) => {
  // Check if file was uploaded
  if (!req.file) {
    res.status(400).json({ message: 'Payment slip file is required' });
    return;
  }

  const slipUrl = `/uploads/${req.file.filename}`;

  const order = await prisma.order.findUnique({
    where: { id: req.params.id as string },
    include: { project: true },
  });

  if (!order) {
    res.status(404).json({ message: 'Order not found' });
    return;
  }

  // Admin can upload payment for any order
  if (req.auth?.role === 'admin') {
    // Allow admin
  } else if (order.project) {
    if (order.project.createdById !== req.auth?.userId) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }
  } else if (order.customerUserId !== req.auth?.userId) {
    res.status(403).json({ message: 'Forbidden' });
    return;
  }

  const payment = await prisma.payment.create({
    data: {
      orderId: order.id,
      slipUrl: slipUrl,
      status: 'pending',
    },
  });

  await prisma.order.update({
    where: { id: order.id },
    data: { status: 'verifying' },
  });

  res.status(201).json(payment);
});
