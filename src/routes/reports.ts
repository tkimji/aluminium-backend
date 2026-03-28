import { Router } from 'express';

import { prisma } from '../prisma';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/roles';

export const reportsRouter = Router();
reportsRouter.use(requireAuth, requireRole('admin'));

reportsRouter.get('/dashboard', async (_req, res) => {
  const [
    userCount,
    orderCount,
    productCount,
    paidOrders,
    totalRevenue,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.order.count(),
    prisma.product.count(),
    prisma.order.count({ where: { status: 'paid' } }),
    prisma.orderItem.aggregate({
      _sum: { totalPrice: true },
    }),
  ]);

  res.json({
    metrics: {
      users: userCount,
      orders: orderCount,
      products: productCount,
      paidOrders,
      totalRevenue: Number(totalRevenue._sum.totalPrice ?? 0),
    },
  });
});

reportsRouter.get('/sales/summary', async (req, res) => {
  const months = Number(req.query.months ?? 12);
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);

  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: start } },
    select: { id: true, createdAt: true },
  });

  const items = await prisma.orderItem.findMany({
    where: {
      orderId: { in: orders.map((o) => o.id) },
    },
    select: { orderId: true, totalPrice: true },
  });

  const totalsByOrder = items.reduce<Record<string, number>>((acc, item) => {
    acc[item.orderId] = (acc[item.orderId] ?? 0) + Number(item.totalPrice);
    return acc;
  }, {});

  const buckets: { month: string; total: number }[] = [];
  for (let i = 0; i < months; i += 1) {
    const date = new Date(start.getFullYear(), start.getMonth() + i, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    buckets.push({ month: key, total: 0 });
  }

  orders.forEach((order) => {
    const key = `${order.createdAt.getFullYear()}-${String(order.createdAt.getMonth() + 1).padStart(2, '0')}`;
    const bucket = buckets.find((b) => b.month === key);
    if (bucket) {
      bucket.total += totalsByOrder[order.id] ?? 0;
    }
  });

  res.json({ data: buckets });
});
