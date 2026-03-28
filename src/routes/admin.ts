import { Router } from 'express';
import { z } from 'zod';

import { prisma } from '../prisma';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/roles';

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

const approvalUpdateSchema = z.object({
  note: z.string().optional(),
});

const subscriptionUpdateSchema = z.object({
  note: z.string().optional(),
});

export const adminRouter = Router();

adminRouter.use(requireAuth, requireRole('admin'));

adminRouter.get('/approvals', async (req, res) => {
  const parsed = paginationSchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid pagination' });
    return;
  }

  const { page, pageSize } = parsed.data;
  const status = req.query.status ? String(req.query.status) : undefined;
  const type = req.query.type ? String(req.query.type) : undefined;

  const where: any = {};
  if (status) where.status = status;
  if (type) where.type = type;

  const [total, data] = await Promise.all([
    prisma.adminApproval.count({ where }),
    prisma.adminApproval.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { subject: { select: { email: true, role: true } } },
    }),
  ]);

  res.json({
    data,
    meta: { page, pageSize, total },
  });
});

adminRouter.post('/approvals/:id/approve', async (req, res) => {
  const parsed = approvalUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid payload' });
    return;
  }

  const approval = await prisma.adminApproval.findUnique({ where: { id: req.params.id } });
  if (!approval) {
    res.status(404).json({ message: 'Approval not found' });
    return;
  }

  const updateData: any = {
    status: 'approved',
    approvedAt: new Date(),
  };
  if (parsed.data.note) updateData.note = parsed.data.note;
  if (req.auth?.userId) updateData.approvedBy = req.auth.userId;

  const updated = await prisma.adminApproval.update({
    where: { id: approval.id },
    data: updateData,
  });

  if (approval.type === 'tech_registration') {
    await prisma.user.update({
      where: { id: approval.userId },
      data: { status: 'active' },
    });
  }

  res.json(updated);
});

adminRouter.post('/approvals/:id/reject', async (req, res) => {
  const parsed = approvalUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid payload' });
    return;
  }

  const approval = await prisma.adminApproval.findUnique({ where: { id: req.params.id } });
  if (!approval) {
    res.status(404).json({ message: 'Approval not found' });
    return;
  }

  const updateData: any = {
    status: 'rejected',
    approvedAt: new Date(),
  };
  if (parsed.data.note) updateData.note = parsed.data.note;
  if (req.auth?.userId) updateData.approvedBy = req.auth.userId;

  const updated = await prisma.adminApproval.update({
    where: { id: approval.id },
    data: updateData,
  });

  res.json(updated);
});

adminRouter.get('/subscription-payments', async (req, res) => {
  const parsed = paginationSchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid pagination' });
    return;
  }

  const { page, pageSize } = parsed.data;
  const status = req.query.status ? String(req.query.status) : undefined;

  const where: any = {};
  if (status) where.status = status;

  const [total, data] = await Promise.all([
    prisma.subscriptionPayment.count({ where }),
    prisma.subscriptionPayment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { subscription: { include: { user: true } } },
    }),
  ]);

  res.json({ data, meta: { page, pageSize, total } });
});

adminRouter.post('/subscription-payments/:id/approve', async (req, res) => {
  const parsed = subscriptionUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid payload' });
    return;
  }

  const payment = await prisma.subscriptionPayment.findUnique({
    where: { id: req.params.id },
    include: { subscription: true },
  });

  if (!payment) {
    res.status(404).json({ message: 'Subscription payment not found' });
    return;
  }

  const now = new Date();
  const end = payment.subscription.plan === 'yearly'
    ? new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000)
    : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const paymentUpdateData: any = {
    status: 'approved',
    approvedAt: now,
  };
  if (req.auth?.userId) paymentUpdateData.approvedBy = req.auth.userId;

  const [updatedPayment] = await prisma.$transaction([
    prisma.subscriptionPayment.update({
      where: { id: payment.id },
      data: paymentUpdateData,
    }),
    prisma.subscription.update({
      where: { id: payment.subscriptionId },
      data: {
        status: 'active',
        startAt: now,
        endAt: end,
      },
    }),
    prisma.user.update({
      where: { id: payment.subscription.userId },
      data: { status: 'active' },
    }),
  ]);

  res.json(updatedPayment);
});

adminRouter.post('/subscription-payments/:id/reject', async (req, res) => {
  const parsed = subscriptionUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid payload' });
    return;
  }

  const payment = await prisma.subscriptionPayment.findUnique({ where: { id: req.params.id } });
  if (!payment) {
    res.status(404).json({ message: 'Subscription payment not found' });
    return;
  }

  const updateData: any = {
    status: 'rejected',
    approvedAt: new Date(),
  };
  if (req.auth?.userId) updateData.approvedBy = req.auth.userId;

  const updated = await prisma.subscriptionPayment.update({
    where: { id: payment.id },
    data: updateData,
  });

  res.json(updated);
});

adminRouter.get('/payments', async (req, res) => {
  const parsed = paginationSchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid pagination' });
    return;
  }

  const { page, pageSize } = parsed.data;
  const status = req.query.status ? String(req.query.status) : undefined;
  const where: any = {};
  if (status) where.status = status;

  const [total, data] = await Promise.all([
    prisma.payment.count({ where }),
    prisma.payment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { order: true },
    }),
  ]);

  res.json({ data, meta: { page, pageSize, total } });
});

adminRouter.post('/payments/:id/approve', async (req, res) => {
  const payment = await prisma.payment.findUnique({
    where: { id: req.params.id },
    include: { order: true },
  });

  if (!payment) {
    res.status(404).json({ message: 'Payment not found' });
    return;
  }

  const now = new Date();
  const paymentUpdateData: any = {
    status: 'approved',
    approvedAt: now,
  };
  if (req.auth?.userId) paymentUpdateData.approvedBy = req.auth.userId;

  const [updatedPayment] = await prisma.$transaction([
    prisma.payment.update({
      where: { id: payment.id },
      data: paymentUpdateData,
    }),
    prisma.order.update({
      where: { id: payment.orderId },
      data: { status: 'paid' },
    }),
  ]);

  res.json(updatedPayment);
});

adminRouter.post('/payments/:id/reject', async (req, res) => {
  const payment = await prisma.payment.findUnique({ where: { id: req.params.id } });
  if (!payment) {
    res.status(404).json({ message: 'Payment not found' });
    return;
  }

  const updateData: any = {
    status: 'rejected',
    approvedAt: new Date(),
  };
  if (req.auth?.userId) updateData.approvedBy = req.auth.userId;

  const updated = await prisma.payment.update({
    where: { id: payment.id },
    data: updateData,
  });

  res.json(updated);
});

// GET /admin/users - Get all users
adminRouter.get('/users', async (req, res) => {
  try {
    const { page = '1', limit = '100', role, status, search } = req.query;
    
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    
    if (role && typeof role === 'string') {
      where.role = role;
    }

    if (status && typeof status === 'string') {
      where.status = status;
    }

    if (search && typeof search === 'string') {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          phone: true,
          role: true,
          status: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.user.count({ where })
    ]);

    res.json({
      data: users,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /admin/users - Create new user
adminRouter.post('/users', async (req, res) => {
  try {
    const userSchema = z.object({
      email: z.string().email(),
      password: z.string().min(6),
      phone: z.string().optional(),
      role: z.enum(['user', 'tech', 'admin']),
      status: z.enum(['active', 'inactive', 'pending']).default('active')
    });

    const parsed = userSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: 'Invalid data', errors: parsed.error.errors });
      return;
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: parsed.data.email }
    });

    if (existingUser) {
      res.status(400).json({ message: 'Email already exists' });
      return;
    }

    // Hash password (you should use bcrypt in production)
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash(parsed.data.password, 10);

    const user = await prisma.user.create({
      data: {
        email: parsed.data.email,
        password: hashedPassword,
        phone: parsed.data.phone,
        role: parsed.data.role,
        status: parsed.data.status
      },
      select: {
        id: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true
      }
    });

    res.status(201).json({ data: user });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// PATCH /admin/users/:id - Update user
adminRouter.patch('/users/:id', async (req, res) => {
  try {
    const userUpdateSchema = z.object({
      email: z.string().email().optional(),
      password: z.string().min(6).optional(),
      phone: z.string().optional(),
      role: z.enum(['user', 'tech', 'admin']).optional(),
      status: z.enum(['active', 'inactive', 'pending']).optional()
    });

    const parsed = userUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: 'Invalid data', errors: parsed.error.errors });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.params.id }
    });

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Check if email is being changed and already exists
    if (parsed.data.email && parsed.data.email !== user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: parsed.data.email }
      });

      if (existingUser) {
        res.status(400).json({ message: 'Email already exists' });
        return;
      }
    }

    const updateData: any = { ...parsed.data };

    // Hash password if provided
    if (parsed.data.password) {
      const bcrypt = require('bcrypt');
      updateData.password = await bcrypt.hash(parsed.data.password, 10);
    }

    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        updatedAt: true
      }
    });

    res.json({ data: updated });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// DELETE /admin/users/:id - Delete user
adminRouter.delete('/users/:id', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id }
    });

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    await prisma.user.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});
