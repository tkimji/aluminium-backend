import { Router } from 'express';

import { prisma } from '../prisma';
import { requireAuth } from '../middleware/auth';

export const receiptsRouter = Router();
receiptsRouter.use(requireAuth);

receiptsRouter.get('/:orderId', async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.orderId },
    include: {
      items: { include: { product: true } },
      project: true,
      etax: true,
    },
  });

  if (!order) {
    res.status(404).json({ message: 'Order not found' });
    return;
  }

  if (req.auth?.role !== 'admin') {
    if (!order.project || order.project.createdById !== req.auth?.userId) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }
  }

  const total = order.items.reduce((sum, item) => sum + Number(item.totalPrice), 0);
  const vat = total * 0.07;
  const grandTotal = total + vat;

  res.json({
    order: {
      id: order.id,
      code: order.code,
      status: order.status,
      createdAt: order.createdAt,
    },
    customer: {
      name: order.project?.customerName ?? '- ',
      phone: order.project?.phone ?? '-',
      address: {
        houseNo: order.project?.houseNo ?? '',
        moo: order.project?.moo ?? '',
        road: order.project?.road ?? '',
        province: order.project?.province ?? '',
        district: order.project?.district ?? '',
        subdistrict: order.project?.subdistrict ?? '',
        postalCode: order.project?.postalCode ?? '',
      },
      taxId: order.project?.taxId ?? null,
    },
    items: order.items.map((item) => ({
      productId: item.productId,
      name: item.product.name,
      qty: item.qty,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
    })),
    summary: {
      subtotal: total,
      vat,
      grandTotal,
    },
    etax: order.etax,
  });
});
