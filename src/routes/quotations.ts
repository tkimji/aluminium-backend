import { Router } from 'express';
import { z } from 'zod';

import { prisma } from '../prisma';
import { requireAuth } from '../middleware/auth';
import { requireRoleOrAdmin } from '../middleware/roles';

const quotationCreateSchema = z.object({
  projectId: z.string(),
});

const quotationUpdateSchema = z.object({
  status: z.enum(['draft', 'sent', 'approved', 'void']).optional(),
});

const itemSchema = z.object({
  description: z.string().min(1),
  qty: z.coerce.number().int().min(1),
  unit: z.string().optional(),
  unitPrice: z.coerce.number().min(0),
  total: z.coerce.number().min(0),
});

export const quotationsRouter = Router();
quotationsRouter.use(requireAuth, requireRoleOrAdmin('tech'));

quotationsRouter.get('/', async (req, res) => {
  const role = req.auth?.role;
  const userId = req.auth?.userId;

  // Filter parameters
  const { projectName, customerName, status, page, limit } = req.query;

  // Pagination
  const pageNum = page && typeof page === 'string' ? parseInt(page, 10) : 1;
  const limitNum = limit && typeof limit === 'string' ? parseInt(limit, 10) : 10;
  const skip = (pageNum - 1) * limitNum;

  // Build where clause
  const where: any = {};

  // Role-based filtering
  if (role !== 'admin' && userId) {
    where.project = {
      createdById: userId
    };
  }

  // Status filter
  if (status && typeof status === 'string') {
    where.status = status;
  }

  // Project name or customer name filter
  if (projectName || customerName) {
    where.project = {
      ...where.project,
      OR: []
    };

    if (projectName && typeof projectName === 'string') {
      where.project.OR.push({
        name: { contains: projectName, mode: 'insensitive' }
      });
    }

    if (customerName && typeof customerName === 'string') {
      where.project.OR.push({
        customerName: { contains: customerName, mode: 'insensitive' }
      });
    }
  }

  // Get total count for pagination
  const total = await prisma.quotation.count({ where });

  const data = await prisma.quotation.findMany({
    where,
    include: {
      project: {
        select: {
          id: true,
          name: true,
          customerName: true,
          phone: true
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    skip,
    take: limitNum
  });

  res.json({ 
    data,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    }
  });
});

quotationsRouter.post('/', async (req, res) => {
  const parsed = quotationCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid payload', errors: parsed.error.flatten() });
    return;
  }

  const project = await prisma.project.findUnique({ 
    where: { id: parsed.data.projectId },
    include: { 
      items: {
        include: {
          product: true
        }
      }
    }
  });
  
  if (!project) {
    res.status(404).json({ message: 'Project not found' });
    return;
  }

  if (req.auth?.role !== 'admin' && project.createdById !== req.auth?.userId) {
    res.status(403).json({ message: 'Forbidden' });
    return;
  }

  const latest = await prisma.quotation.findFirst({
    where: { projectId: project.id },
    orderBy: { version: 'desc' },
  });

  // Create quotation with items from project
  const quotation = await prisma.quotation.create({
    data: {
      projectId: project.id,
      version: latest ? latest.version + 1 : 1,
      items: {
        create: project.items
          // Include all items regardless of status for quotation
          .map(item => {
            const unitPrice = item.product?.priceManual || 0;
            const qty = item.quantity || 1;
            const total = Number(unitPrice) * qty;
            
            return {
              description: `${item.product?.name || 'สินค้า'} (${item.width || 0}x${item.height || 0} มม.)`,
              qty: qty,
              unit: item.unit || 'ชุด',
              unitPrice: unitPrice,
              total: total
            };
          })
      }
    },
    include: {
      items: true
    }
  });

  await prisma.project.update({
    where: { id: project.id },
    data: { status: 'quoted' },
  });

  res.status(201).json(quotation);
});

quotationsRouter.get('/:id', async (req, res) => {
  const quotation = await prisma.quotation.findUnique({
    where: { id: req.params.id },
    include: { items: true, project: true },
  });

  if (!quotation) {
    res.status(404).json({ message: 'Quotation not found' });
    return;
  }

  if (req.auth?.role !== 'admin' && quotation.project.createdById !== req.auth?.userId) {
    res.status(403).json({ message: 'Forbidden' });
    return;
  }

  res.json(quotation);
});

quotationsRouter.patch('/:id', async (req, res) => {
  const parsed = quotationUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid payload', errors: parsed.error.flatten() });
    return;
  }

  const quotation = await prisma.quotation.findUnique({
    where: { id: req.params.id },
    include: { project: true },
  });

  if (!quotation) {
    res.status(404).json({ message: 'Quotation not found' });
    return;
  }

  if (req.auth?.role !== 'admin' && quotation.project.createdById !== req.auth?.userId) {
    res.status(403).json({ message: 'Forbidden' });
    return;
  }

  const cleanData = Object.fromEntries(
    Object.entries(parsed.data).filter(([_, v]) => v !== undefined)
  );

  const updated = await prisma.quotation.update({
    where: { id: quotation.id },
    data: cleanData,
  });

  res.json(updated);
});

quotationsRouter.post('/:id/items', async (req, res) => {
  const parsed = itemSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid payload', errors: parsed.error.flatten() });
    return;
  }

  const quotation = await prisma.quotation.findUnique({
    where: { id: req.params.id },
    include: { project: true },
  });

  if (!quotation) {
    res.status(404).json({ message: 'Quotation not found' });
    return;
  }

  if (req.auth?.role !== 'admin' && quotation.project.createdById !== req.auth?.userId) {
    res.status(403).json({ message: 'Forbidden' });
    return;
  }

  const cleanData = Object.fromEntries(
    Object.entries(parsed.data).filter(([_, v]) => v !== undefined)
  );

  const created = await prisma.quotationItem.create({
    data: {
      quotationId: quotation.id,
      ...cleanData,
    } as any,
  });

  res.status(201).json(created);
});

quotationsRouter.patch('/:id/items/:itemId', async (req, res) => {
  const parsed = itemSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid payload', errors: parsed.error.flatten() });
    return;
  }

  const item = await prisma.quotationItem.findUnique({
    where: { id: req.params.itemId },
    include: { quotation: { include: { project: true } } },
  });

  if (!item || item.quotationId !== req.params.id) {
    res.status(404).json({ message: 'Item not found' });
    return;
  }

  if (req.auth?.role !== 'admin' && item.quotation.project.createdById !== req.auth?.userId) {
    res.status(403).json({ message: 'Forbidden' });
    return;
  }

  const cleanData = Object.fromEntries(
    Object.entries(parsed.data).filter(([_, v]) => v !== undefined)
  );

  const updated = await prisma.quotationItem.update({
    where: { id: item.id },
    data: cleanData,
  });

  res.json(updated);
});

quotationsRouter.delete('/:id/items/:itemId', async (req, res) => {
  const item = await prisma.quotationItem.findUnique({
    where: { id: req.params.itemId },
    include: { quotation: { include: { project: true } } },
  });

  if (!item || item.quotationId !== req.params.id) {
    res.status(404).json({ message: 'Item not found' });
    return;
  }

  if (req.auth?.role !== 'admin' && item.quotation.project.createdById !== req.auth?.userId) {
    res.status(403).json({ message: 'Forbidden' });
    return;
  }

  await prisma.quotationItem.delete({ where: { id: item.id } });
  res.status(204).send();
});
