import { Router } from 'express';
import { z } from 'zod';

import { prisma } from '../prisma';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/roles';

const router = Router();
router.use(requireAuth);
router.use(requireRole(['admin', 'technician']));

// GET /admin/receipts - List all receipts (orders with payment info)
router.get('/receipts', async (req, res) => {
  try {
    const { status, search, page = '1', limit = '10' } = req.query;
    
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    
    if (status && typeof status === 'string') {
      where.status = status;
    }

    if (search && typeof search === 'string') {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { project: { customerName: { contains: search, mode: 'insensitive' } } }
      ];
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          project: true,
          items: true,
          etax: true
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.order.count({ where })
    ]);

    const receipts = orders.map(order => {
      const subtotal = order.items.reduce((sum, item) => sum + Number(item.totalPrice), 0);
      const vat = subtotal * 0.07;
      const grandTotal = subtotal + vat;

      return {
        id: order.id,
        code: order.code,
        customerName: order.project?.customerName || '-',
        status: order.status,
        subtotal,
        vat,
        grandTotal,
      //  paymentDate: order.etax?.createdAt || null,
      paymentDate: order.updatedAt || null,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt
      };
    });

    res.json({
      data: receipts,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching receipts:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /admin/receipts/:id - Get receipt details
router.get('/receipts/:id', async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        items: { include: { product: true } },
        project: true,
        etax: true
      }
    });

    if (!order) {
      res.status(404).json({ message: 'Receipt not found' });
      return;
    }

    const subtotal = order.items.reduce((sum, item) => sum + Number(item.totalPrice), 0);
    const vat = subtotal * 0.07;
    const grandTotal = subtotal + vat;

    res.json({
      data: {
        order: {
          id: order.id,
          code: order.code,
          status: order.status,
          createdAt: order.createdAt
        },
        customer: {
          name: order.project?.customerName ?? '-',
          phone: order.project?.phone ?? '-',
          address: {
            houseNo: order.project?.houseNo ?? '',
            moo: order.project?.moo ?? '',
            road: order.project?.road ?? '',
            province: order.project?.province ?? '',
            district: order.project?.district ?? '',
            subdistrict: order.project?.subdistrict ?? '',
            postalCode: order.project?.postalCode ?? ''
          },
          taxId: order.project?.taxId ?? null
        },
        items: order.items.map(item => ({
          productId: item.productId,
          name: item.product.name,
          qty: item.qty,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice
        })),
        summary: {
          subtotal,
          vat,
          grandTotal
        },
        etax: order.etax
      }
    });
  } catch (error) {
    console.error('Error fetching receipt:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export const adminReceiptsRouter = router;
