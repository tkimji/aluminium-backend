import cors from 'cors';
import express from 'express';
import path from 'path';
import swaggerUi from 'swagger-ui-express';

import { swaggerSpec } from './swagger';
import { adminRouter } from './routes/admin';
import { adminAluminiumRouter } from './routes/admin-aluminium';
import { adminFormulasRouter } from './routes/admin-formulas';
import { adminMastersRouter } from './routes/admin-masters';
import { adminProductsRouter } from './routes/admin-products';
import { adminReceiptsRouter } from './routes/admin-receipts';
import { adminWarehouseRouter } from './routes/admin-warehouse';
import { authRouter } from './routes/auth';
import { cartRouter } from './routes/cart';
import { etaxRouter } from './routes/etax';
import { healthRouter } from './routes/health';
import { locationsRouter } from './routes/locations';
import { notificationsRouter } from './routes/notifications';
import { ordersRouter } from './routes/orders';
import { productsRouter } from './routes/products';
import { projectsRouter } from './routes/projects';
import { quotationsRouter } from './routes/quotations';
import { receiptsRouter } from './routes/receipts';
import { reportsRouter } from './routes/reports';
import { subscriptionRouter } from './routes/subscriptions';
import { uploadsRouter } from './routes/uploads';

export const createApp = () => {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  app.get('/', (_req, res) => {
    res.json({ name: 'aluminium2026-backend', status: 'ok' });
  });

  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  app.use('/health', healthRouter);
  app.use('/locations', locationsRouter);
  app.use('/auth', authRouter);
  app.use('/admin', adminAluminiumRouter);
  app.use('/admin', adminFormulasRouter);    // ← ย้ายขึ้นมาก่อน adminRouter
  app.use('/admin', adminMastersRouter);
  app.use('/admin', adminProductsRouter);
  app.use('/admin', adminReceiptsRouter);
  app.use('/admin', adminWarehouseRouter);
  app.use('/admin', adminRouter);            // ← ย้ายลงมาเป็นตัวสุดท้าย (catch-all)
  app.use('/cart', cartRouter);
  app.use('/projects', projectsRouter);
  app.use('/quotations', quotationsRouter);
  app.use('/orders', ordersRouter);
  app.use('/products', productsRouter);
  app.use('/subscriptions', subscriptionRouter);
  app.use('/uploads', uploadsRouter);
  app.use('/notifications', notificationsRouter);
  app.use('/etax', etaxRouter);
  app.use('/receipts', receiptsRouter);
  app.use('/reports', reportsRouter);

  app.use((req, res) => {
    res.status(404).json({ message: 'Not found', path: req.path });
  });

  return app;
};
