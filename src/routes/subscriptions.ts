import { Router } from 'express';
import { z } from 'zod';

import { prisma } from '../prisma';

const paymentSchema = z.object({
  email: z.string().email(),
  slipUrl: z.string().min(1),
});

export const subscriptionRouter = Router();

subscriptionRouter.post('/:id/payments', async (req, res) => {
  const parsed = paymentSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid payload', errors: parsed.error.flatten() });
    return;
  }

  const subscription = await prisma.subscription.findUnique({
    where: { id: req.params.id },
    include: { user: true },
  });

  if (!subscription) {
    res.status(404).json({ message: 'Subscription not found' });
    return;
  }

  if (subscription.user.email !== parsed.data.email) {
    res.status(403).json({ message: 'Email does not match subscription owner' });
    return;
  }

  const payment = await prisma.subscriptionPayment.create({
    data: {
      subscriptionId: subscription.id,
      slipUrl: parsed.data.slipUrl,
      status: 'pending',
    },
  });

  res.status(201).json(payment);
});
