import { Router } from 'express';
import { z } from 'zod';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

import { prisma } from '../prisma';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/roles';

// Configure multer for image upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/aluminium';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'aluminium-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

const aluminiumSchema = z.object({
  code: z.string().optional(),
  name: z.string().min(1),
  status: z.enum(['active', 'inactive']).optional(),
});

export const adminAluminiumRouter = Router();
adminAluminiumRouter.use(requireAuth, requireRole(['admin', 'tech']));

// Get all aluminium items
adminAluminiumRouter.get('/aluminium-items', async (req, res) => {
  const search = String(req.query.search ?? '').trim();
  const status = req.query.status as string | undefined;

  const data = await prisma.aluminiumItem.findMany({
    where: {
      AND: [
        search ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { code: { contains: search, mode: 'insensitive' } },
          ],
        } : {},
        status ? { status: status as any } : {},
      ],
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ data });
});

// Get single aluminium item
adminAluminiumRouter.get('/aluminium-items/:id', async (req, res) => {
  const item = await prisma.aluminiumItem.findUnique({
    where: { id: req.params.id },
  });

  if (!item) {
    res.status(404).json({ message: 'Aluminium item not found' });
    return;
  }

  res.json(item);
});

// Create aluminium item with image upload
adminAluminiumRouter.post('/aluminium-items', upload.single('image'), async (req, res) => {
  const parsed = aluminiumSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid payload', errors: parsed.error.flatten() });
    return;
  }

  const imagePath = req.file ? `/uploads/aluminium/${req.file.filename}` : null;

  const created = await prisma.aluminiumItem.create({
    data: {
      ...parsed.data,
      code: parsed.data.code ?? null,
      imagePath,
    } as any,
  });

  res.status(201).json(created);
});

// Update aluminium item with optional image upload
adminAluminiumRouter.patch('/aluminium-items/:id', upload.single('image'), async (req, res) => {
  const item = await prisma.aluminiumItem.findUnique({
    where: { id: req.params.id as string },
  });

  if (!item) {
    res.status(404).json({ message: 'Aluminium item not found' });
    return;
  }

  const parsed = aluminiumSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid payload', errors: parsed.error.flatten() });
    return;
  }

  const cleanData = Object.fromEntries(
    Object.entries(parsed.data).filter(([_, v]) => v !== undefined)
  );

  // Handle image upload
  let imagePath = item.imagePath;
  if (req.file) {
    // Delete old image if exists
    if (item.imagePath) {
      const oldImagePath = path.join(process.cwd(), item.imagePath);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }
    imagePath = `/uploads/aluminium/${req.file.filename}`;
  }

  const updated = await prisma.aluminiumItem.update({
    where: { id: req.params.id as string },
    data: {
      ...cleanData,
      ...(imagePath !== item.imagePath && { imagePath }),
    },
  });

  res.json(updated);
});

// Delete aluminium item
adminAluminiumRouter.delete('/aluminium-items/:id', async (req, res) => {
  const item = await prisma.aluminiumItem.findUnique({
    where: { id: req.params.id },
  });

  if (!item) {
    res.status(404).json({ message: 'Aluminium item not found' });
    return;
  }

  // Delete image file if exists
  if (item.imagePath) {
    const imagePath = path.join(process.cwd(), item.imagePath);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }
  }

  await prisma.aluminiumItem.delete({
    where: { id: req.params.id },
  });

  res.status(204).send();
});
