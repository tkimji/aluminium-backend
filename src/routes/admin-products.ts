import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { z } from 'zod';
import * as XLSX from 'xlsx';

import { buildProductsImportTemplateBuffer } from '../lib/products-import-template';
import { prisma } from '../prisma';
import { logger } from '../logger';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/roles';

const uploadDir = path.join(process.cwd(), 'uploads', 'products');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const productImageStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${req.params.id}-${Date.now()}${ext}`);
  },
});

const productImageUpload = multer({
  storage: productImageStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

const excelUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const extOk = /\.xlsx$/i.test(file.originalname);
    const mimeOk =
      file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.mimetype === 'application/octet-stream';
    cb(null, extOk || mimeOk);
  },
});

/** Maps normalized header labels → canonical field keys */
const IMPORT_HEADER_ALIASES: Record<string, string> = {
  sku: 'sku',
  name: 'name',
  itemformat: 'itemFormat',
  item_format: 'itemFormat',
  producttypeid: 'productTypeId',
  product_type_id: 'productTypeId',
  producttypecode: 'productTypeCode',
  product_type_code: 'productTypeCode',
  unitid: 'unitId',
  unit_id: 'unitId',
  unitcode: 'unitCode',
  unit_code: 'unitCode',
  brandid: 'brandId',
  brand_id: 'brandId',
  brandcode: 'brandCode',
  brand_code: 'brandCode',
  warehouseid: 'warehouseId',
  warehouse_id: 'warehouseId',
  warehousecode: 'warehouseCode',
  warehouse_code: 'warehouseCode',
  pricemanual: 'priceManual',
  price_manual: 'priceManual',
  pricesource: 'priceSource',
  price_source: 'priceSource',
  formulaid: 'formulaId',
  formula_id: 'formulaId',
  status: 'status',
  description: 'description',
  imageurl: 'imageUrl',
  image_url: 'imageUrl',
};

function normalizeImportHeader(raw: string): string | null {
  const key = String(raw).trim().replace(/\s+/g, '').toLowerCase();
  if (!key) return null;
  return IMPORT_HEADER_ALIASES[key] ?? null;
}

function cellToString(v: unknown): string {
  if (v === undefined || v === null) return '';
  if (typeof v === 'number') return String(v);
  return String(v).trim();
}

function normalizeImportRow(row: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [rawKey, rawVal] of Object.entries(row)) {
    const canon = normalizeImportHeader(rawKey);
    if (!canon) continue;
    out[canon] = cellToString(rawVal);
  }
  return out;
}

function parseOptionalNumber(s: string | undefined): number | undefined {
  if (s === undefined) return undefined;
  const t = String(s).trim();
  if (t === '') return undefined;
  const n = Number(t);
  return Number.isFinite(n) ? n : undefined;
}

function bodyForLog(body: unknown): Record<string, unknown> {
  if (!body || typeof body !== 'object') return {};
  const o = { ...(body as Record<string, unknown>) };
  const img = o.imageUrl;
  if (typeof img === 'string' && img.length > 100) {
    o.imageUrl = `[truncated ${img.length} chars]`;
  }
  return o;
}

const itemFormatEnum = z.enum(['MTO', 'PRESET', 'MATERIAL']);
const priceSourceEnum = z.enum(['MANUAL', 'FORMULA']);

const productSchema = z.object({
  sku: z.string().min(1),
  name: z.string().min(1),
  itemFormat: itemFormatEnum,
  productTypeId: z.string().min(1),
  unitId: z.string().min(1),
  brandId: z.string().optional(),
  warehouseId: z.string().optional(),
  priceManual: z.coerce.number().optional(),
  priceSource: priceSourceEnum.optional(),
  formulaId: z
    .union([z.string(), z.null()])
    .optional()
    .transform((v) => (v === '' || v === null) ? null : v),
  status: z.enum(['active', 'inactive']).optional(),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
});

const productUpdateSchema = productSchema.partial().extend({
  sku: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
});

export const adminProductsRouter = Router();
adminProductsRouter.use(requireAuth, requireRole('admin'));

adminProductsRouter.get('/products', async (req, res) => {
  const search = String(req.query.search ?? '').trim();
  const data = await prisma.product.findMany({
    ...(search && {
      where: {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } },
        ],
      },
    }),
    orderBy: { createdAt: 'desc' },
  });

  res.json({ data });
});

adminProductsRouter.get('/products/import/template', (_req, res) => {
  const buf = buildProductsImportTemplateBuffer();
  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader(
    'Content-Disposition',
    'attachment; filename="products-import-template.xlsx"'
  );
  res.send(buf);
});

adminProductsRouter.post('/products/import', excelUpload.single('file'), async (req, res) => {
  if (!req.file?.buffer?.length) {
    res.status(400).json({ message: 'Excel file is required (multipart field name: file)' });
    return;
  }

  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
  } catch (e) {
    logger.warn(`Excel parse failed: ${e}`);
    res.status(400).json({ message: 'Could not read Excel file' });
    return;
  }

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    res.status(400).json({ message: 'Workbook has no sheets' });
    return;
  }

  const sheet = workbook.Sheets[sheetName];
  if (!sheet) {
    res.status(400).json({ message: 'First sheet could not be read' });
    return;
  }
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });

  const [productTypes, units, brands, warehouses] = await Promise.all([
    prisma.productType.findMany({ select: { id: true, code: true } }),
    prisma.unit.findMany({ select: { id: true, code: true } }),
    prisma.brand.findMany({ select: { id: true, code: true } }),
    prisma.warehouse.findMany({ select: { id: true, code: true } }),
  ]);

  const ptByCode = new Map(
    productTypes
      .filter((p): p is typeof p & { code: string } => Boolean(p.code))
      .map((p) => [p.code.toLowerCase(), p.id])
  );
  const validProductTypeIds = new Set(productTypes.map((p) => p.id));
  const unitByCode = new Map(
    units
      .filter((u): u is typeof u & { code: string } => Boolean(u.code))
      .map((u) => [u.code.toLowerCase(), u.id])
  );
  const validUnitIds = new Set(units.map((u) => u.id));
  const brandByCode = new Map(
    brands.filter((b): b is typeof b & { code: string } => Boolean(b.code)).map((b) => [
      String(b.code).toLowerCase(),
      b.id,
    ])
  );
  const validBrandIds = new Set(brands.map((b) => b.id));
  const whByCode = new Map(warehouses.map((w) => [w.code.toLowerCase(), w.id]));
  const validWarehouseIds = new Set(warehouses.map((w) => w.id));

  type ImportRowError = { row: number; sku: string; reason: string };
  const errors: ImportRowError[] = [];
  const createdIds: string[] = [];
  const seenSkus = new Set<string>();

  let excelRow = 2;

  for (const raw of rows) {
    const r = normalizeImportRow(raw);
    const sku = (r.sku ?? '').trim();
    if (!sku) {
      excelRow++;
      continue;
    }

    if (seenSkus.has(sku)) {
      errors.push({ row: excelRow, sku, reason: 'Duplicate SKU in file' });
      excelRow++;
      continue;
    }
    seenSkus.add(sku);

    let productTypeId = (r.productTypeId ?? '').trim();
    if (productTypeId && !validProductTypeIds.has(productTypeId)) {
      errors.push({ row: excelRow, sku, reason: 'productTypeId does not match any product type' });
      excelRow++;
      continue;
    }

    if (!productTypeId && r.productTypeCode) {
      const id = ptByCode.get(r.productTypeCode.toLowerCase());
      if (!id) {
        errors.push({
          row: excelRow,
          sku,
          reason: `Unknown productTypeCode: ${r.productTypeCode}`,
        });
        excelRow++;
        continue;
      }
      productTypeId = id;
    }

    let unitId = (r.unitId ?? '').trim();
    if (unitId && !validUnitIds.has(unitId)) {
      errors.push({ row: excelRow, sku, reason: 'unitId does not match any unit' });
      excelRow++;
      continue;
    }

    if (!unitId && r.unitCode) {
      const id = unitByCode.get(r.unitCode.toLowerCase());
      if (!id) {
        errors.push({ row: excelRow, sku, reason: `Unknown unitCode: ${r.unitCode}` });
        excelRow++;
        continue;
      }
      unitId = id;
    }

    let brandId: string | undefined;
    const bid = (r.brandId ?? '').trim();
    if (bid) {
      if (!validBrandIds.has(bid)) {
        errors.push({ row: excelRow, sku, reason: 'brandId does not match any brand' });
        excelRow++;
        continue;
      }
      brandId = bid;
    } else if (r.brandCode) {
      const id = brandByCode.get(r.brandCode.toLowerCase());
      if (!id) {
        errors.push({ row: excelRow, sku, reason: `Unknown brandCode: ${r.brandCode}` });
        excelRow++;
        continue;
      }
      brandId = id;
    }

    let warehouseId: string | undefined;
    const wid = (r.warehouseId ?? '').trim();
    if (wid) {
      if (!validWarehouseIds.has(wid)) {
        errors.push({ row: excelRow, sku, reason: 'warehouseId does not match any warehouse' });
        excelRow++;
        continue;
      }
      warehouseId = wid;
    } else if (r.warehouseCode) {
      const id = whByCode.get(r.warehouseCode.toLowerCase());
      if (!id) {
        errors.push({
          row: excelRow,
          sku,
          reason: `Unknown warehouseCode: ${r.warehouseCode}`,
        });
        excelRow++;
        continue;
      }
      warehouseId = id;
    }

    const itemFormat = r.itemFormat ? r.itemFormat.trim().toUpperCase() : '';
    const priceSourceRaw = r.priceSource ? r.priceSource.trim().toUpperCase() : '';

    const payload = {
      sku,
      name: (r.name ?? '').trim(),
      itemFormat,
      productTypeId,
      unitId,
      ...(brandId && { brandId }),
      ...(warehouseId && { warehouseId }),
      ...(parseOptionalNumber(r.priceManual) !== undefined && {
        priceManual: parseOptionalNumber(r.priceManual),
      }),
      ...(priceSourceRaw && { priceSource: priceSourceRaw }),
      ...((r.formulaId ?? '').trim() !== '' && { formulaId: (r.formulaId ?? '').trim() }),
      ...((r.status ?? '').trim() && {
        status: (r.status ?? '').trim().toLowerCase() as 'active' | 'inactive',
      }),
      ...((r.description ?? '').trim() && { description: (r.description ?? '').trim() }),
      ...((r.imageUrl ?? '').trim() && { imageUrl: (r.imageUrl ?? '').trim() }),
    };

    const parsed = productSchema.safeParse(payload);
    if (!parsed.success) {
      const msg = parsed.error.issues
        .map((issue) => `${issue.path.join('.') || 'field'}: ${issue.message}`)
        .join('; ');
      errors.push({ row: excelRow, sku, reason: msg });
      excelRow++;
      continue;
    }

    const existing = await prisma.product.findUnique({ where: { sku: parsed.data.sku } });
    if (existing) {
      errors.push({ row: excelRow, sku, reason: 'SKU already exists in database' });
      excelRow++;
      continue;
    }

    try {
      const {
        brandId: bId,
        warehouseId: wId,
        priceManual,
        priceSource,
        formulaId,
        status,
        description,
        imageUrl,
        ...required
      } = parsed.data;
      const created = await prisma.product.create({
        data: {
          ...required,
          ...(bId && { brandId: bId }),
          ...(wId && { warehouseId: wId }),
          ...(priceManual !== undefined && { priceManual }),
          priceSource: priceSource ?? 'MANUAL',
          formulaId: formulaId ?? null,
          ...(status && { status }),
          ...(description && { description }),
          ...(imageUrl && { imageUrl }),
        },
      });
      createdIds.push(created.id);
    } catch (e) {
      logger.warn(`POST /products/import row ${excelRow} failed: ${e}`);
      errors.push({ row: excelRow, sku, reason: 'Database error while creating product' });
    }

    excelRow++;
  }

  res.json({
    success: true,
    message: `Created ${createdIds.length} product(s); ${errors.length} row(s) failed.`,
    data: { createdIds, errors },
  });
});

adminProductsRouter.get('/products/:id', async (req, res) => {
  const product = await prisma.product.findUnique({
    where: { id: req.params.id },
    include: {
      productType: true,
      unit: true,
      brand: true,
      warehouse: true,
      formula: true
    }
  });

  if (!product) {
    res.status(404).json({ message: 'Product not found' });
    return;
  }

  res.json({ data: product });
});

adminProductsRouter.post('/products', async (req, res) => {
  const parsed = productSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid payload', errors: parsed.error.flatten() });
    return;
  }

  const { brandId, warehouseId, priceManual, priceSource, formulaId, status, description, imageUrl, ...required } = parsed.data;
  const created = await prisma.product.create({
    data: {
      ...required,
      ...(brandId && { brandId }),
      ...(warehouseId && { warehouseId }),
      ...(priceManual !== undefined && { priceManual }),
      priceSource: priceSource ?? 'MANUAL',
      formulaId: formulaId ?? null,
      ...(status && { status }),
      ...(description && { description }),
      ...(imageUrl && { imageUrl }),
    },
  });

  res.status(201).json(created);
});

adminProductsRouter.patch('/products/:id', async (req, res) => {
  const productId = req.params.id;
  logger.info(
    `PATCH /admin/products/${productId} rawBody=${JSON.stringify(bodyForLog(req.body))}`
  );

  const parsed = productUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    logger.warn(
      `PATCH /admin/products/${productId} validation failed ${JSON.stringify(parsed.error.flatten())}`
    );
    res.status(400).json({ message: 'Invalid payload', errors: parsed.error.flatten() });
    return;
  }

  const cleanData: Record<string, unknown> = Object.fromEntries(
    Object.entries(parsed.data).filter(([_, v]) => v !== undefined)
  );

  // Empty-string FK → null so Prisma doesn't try to reference a non-existent row
  if (cleanData.formulaId === '') cleanData.formulaId = null;

  

  const updated = await prisma.product.update({
    where: { id: productId },
    data: cleanData,
  });

  //logger.info(`PATCH /admin/products/${productId} ok sku=${updated.sku}`);
  res.json(updated);
});

adminProductsRouter.post('/products/:id/image', productImageUpload.single('image'), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ message: 'File is required' });
    return;
  }

  const productId = String(req.params.id);
  const imageUrl = `/uploads/products/${req.file.filename}`;

  const updated = await prisma.product.update({
    where: { id: productId },
    data: { imageUrl },
  });

  logger.info(`POST /admin/products/${productId}/image saved ${imageUrl}`);
  res.json({ imageUrl: updated.imageUrl });
});
