import { Router } from 'express';
import path from 'path';
import PDFDocument from 'pdfkit';
import { z } from 'zod';

import { prisma } from '../prisma';
import { requireAuth } from '../middleware/auth';
import { requireRoleOrAdmin } from '../middleware/roles';

const quotationCreateSchema = z.object({
  projectId: z.string(),
});

const quotationUpdateSchema = z.object({
  status: z.enum(['draft', 'sent', 'approved', 'void']).optional(),
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
  discount: z.coerce.number().min(0).optional(),
  vatEnabled: z.boolean().optional(),
  withholdingTaxPercent: z.coerce.number().min(0).optional(),
  employeeName: z.string().optional(),
  referenceNo: z.string().optional(),
  description: z.string().optional(),
  quotationDate: z.string().optional(),
  creditDays: z.coerce.number().int().min(0).optional(),
  dueDate: z.string().optional(),
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

function buildQuotationCustomerName(q: {
  project?: {
    createdBy?: {
      email?: string | null;
      profile?: { firstName?: string | null; lastName?: string | null } | null;
    } | null;
  } | null;
}): string {
  const first = q.project?.createdBy?.profile?.firstName?.trim() ?? '';
  const last = q.project?.createdBy?.profile?.lastName?.trim() ?? '';
  const full = [first, last].filter(Boolean).join(' ').trim();
  return full || q.project?.createdBy?.email || '-';
}

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
      where.project.OR.push(
        {
          createdBy: {
            profile: {
              firstName: { contains: customerName, mode: 'insensitive' }
            }
          }
        },
        {
          createdBy: {
            profile: {
              lastName: { contains: customerName, mode: 'insensitive' }
            }
          }
        },
        {
          createdBy: {
            email: { contains: customerName, mode: 'insensitive' }
          }
        }
      );
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
          phone: true,
          createdBy: {
            select: {
              email: true,
              profile: {
                select: { firstName: true, lastName: true }
              }
            }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    skip,
    take: limitNum
  });

  const dataWithCustomerName = data.map((q) => ({
    ...q,
    customerName: buildQuotationCustomerName(q),
  }));

  res.json({ 
    data: dataWithCustomerName,
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
            const unitPrice = item.price != null
              ? Number(item.price)
              : Number(item.product?.priceManual || 0);
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
    include: {
      items: true,
      project: {
        select: {
          id: true,
          name: true,
          customerName: true,
          phone: true,
          createdById: true,
          createdBy: {
            select: {
              email: true,
              profile: {
                select: { firstName: true, lastName: true },
              },
            },
          },
        },
      },
    },
  });

  if (!quotation) {
    res.status(404).json({ message: 'Quotation not found' });
    return;
  }

  if (req.auth?.role !== 'admin' && quotation.project.createdById !== req.auth?.userId) {
    res.status(403).json({ message: 'Forbidden' });
    return;
  }

  res.json({
    ...quotation,
    customerName: buildQuotationCustomerName(quotation),
  });
});

quotationsRouter.get('/:id/items', async (req, res) => {
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

  const items = await prisma.quotationItem.findMany({
    where: { quotationId: quotation.id },
    orderBy: { id: 'asc' },
  });

  res.json({ data: items });
});

// --------------- PDF download ---------------

const FONT_DIR = path.join(__dirname, '..', 'fonts');
const FONT_REGULAR = path.join(FONT_DIR, 'THSarabunNew.ttf');
const FONT_BOLD = path.join(FONT_DIR, 'THSarabunNew-Bold.ttf');

function fmtNumber(n: number | string): string {
  return Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

quotationsRouter.get('/:id/pdf', async (req, res) => {
  try {
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

    const project = quotation.project;

    // Quotation number
    const d = new Date(quotation.createdAt);
    const qtNo = `QT${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}-v${String(quotation.version).padStart(2, '0')}`;

    // Calculations
    const totalAmount = quotation.items.reduce((s, i) => s + Number(i.total), 0);
    const discount = Number((quotation as any).discount) || 0;
    const discountAmt = (totalAmount * discount) / 100;
    const afterDiscount = totalAmount - discountAmt;
    const vatEnabled = (quotation as any).vatEnabled ?? false;
    const vatAmt = vatEnabled ? (afterDiscount * 7) / 100 : 0;
    const whTaxPct = Number((quotation as any).withholdingTaxPercent) || 0;
    const whTaxAmt = whTaxPct > 0 ? (afterDiscount * whTaxPct) / 100 : 0;
    const grandTotal = afterDiscount + vatAmt - whTaxAmt;

    // Address
    const addr = [
      project.houseNo,
      project.moo ? `หมู่ ${project.moo}` : '',
      project.road ? `ถนน ${project.road}` : '',
      project.subdistrict,
      project.district,
      project.province,
      project.postalCode,
    ].filter(Boolean).join(' ');

    // Build PDF
    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    doc.on('error', (err: any) => {
      console.error('PDF stream error:', err);
      (doc as any).destroy?.();
    });

    res.on('close', () => {
      (doc as any).destroy?.();
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="quotation-${qtNo}.pdf"`);
    doc.pipe(res);

    doc.registerFont('Thai', FONT_REGULAR);
    doc.registerFont('ThaiBold', FONT_BOLD);

    const pageW = doc.page.width - 100; // usable width (margin 50 each side)

    // ── Title ──
    doc.font('ThaiBold').fontSize(22).text('ใบเสนอราคา', { align: 'center' });
    doc.moveDown(0.3);
    doc.font('Thai').fontSize(14).text(`เลขที่: ${qtNo}`, { align: 'center' });
    doc.moveDown(1);

    // ── Customer info ──
    const infoStartY = doc.y;
    doc.font('ThaiBold').fontSize(13).text('ข้อมูลลูกค้า', 50);
    doc.moveDown(0.2);
    doc.font('Thai').fontSize(12);
    doc.text(`ชื่อ: ${project.customerName || '-'}`);
    doc.text(`ที่อยู่: ${addr || '-'}`);
    if (project.taxId) doc.text(`เลขประจำตัวผู้เสียภาษี: ${project.taxId}`);
    doc.text(`โทร: ${project.phone || '-'}`);

    // Right column – dates
    const rightX = 350;
    doc.font('Thai').fontSize(12);
    doc.text(`วันที่: ${(quotation as any).quotationDate ? new Date((quotation as any).quotationDate).toLocaleDateString('th-TH') : d.toLocaleDateString('th-TH')}`, rightX, infoStartY + 18);
    if ((quotation as any).creditDays) doc.text(`เครดิต: ${(quotation as any).creditDays} วัน`, rightX);
    if ((quotation as any).dueDate) doc.text(`ครบกำหนด: ${new Date((quotation as any).dueDate).toLocaleDateString('th-TH')}`, rightX);
    if ((quotation as any).employeeName) doc.text(`พนักงาน: ${(quotation as any).employeeName}`, rightX);

    doc.y = Math.max(doc.y, infoStartY + 90);
    doc.moveDown(1);

    // ── Items table ──
    const colX = [50, 80, 260, 330, 400, 480];
    const colW = [30, 180, 70, 70, 80, 65];
    const headers = ['ลำดับ', 'รายละเอียด', 'จำนวน', 'หน่วย', 'ราคา/หน่วย', 'รวม'];

    // Table header
    const tableTop = doc.y;
    doc.rect(50, tableTop, pageW, 22).fill('#f1f5f9');
    doc.fill('#000');
    doc.font('ThaiBold').fontSize(11);
    headers.forEach((h, i) => {
      doc.text(h, colX[i]!, tableTop + 5, { width: colW[i], align: i >= 2 ? 'right' : 'left' });
    });

    let rowY = tableTop + 25;
    doc.font('Thai').fontSize(11);

    quotation.items.forEach((item, idx) => {
      if (rowY > 720) {
        doc.addPage();
        rowY = 50;
      }

      // Alternate row bg
      if (idx % 2 === 0) {
        doc.rect(50, rowY - 2, pageW, 18).fill('#fafafa');
        doc.fill('#000');
      }

      doc.text(String(idx + 1), colX[0]!, rowY, { width: colW[0], align: 'left' });
      doc.text(item.description, colX[1]!, rowY, { width: colW[1], align: 'left' });
      doc.text(String(item.qty), colX[2]!, rowY, { width: colW[2], align: 'right' });
      doc.text(item.unit || '-', colX[3]!, rowY, { width: colW[3], align: 'right' });
      doc.text(fmtNumber(Number(item.unitPrice)), colX[4]!, rowY, { width: colW[4], align: 'right' });
      doc.text(fmtNumber(Number(item.total)), colX[5]!, rowY, { width: colW[5], align: 'right' });

      rowY += 20;
    });

    // Table bottom line
    doc.moveTo(50, rowY).lineTo(50 + pageW, rowY).lineWidth(0.5).stroke('#cbd5e1');
    doc.y = rowY + 10;

    // ── Summary ──
    const sumX = 350;
    const valX = 480;
    const lineH = 18;

    const summaryLine = (label: string, value: string, bold = false) => {
      doc.font(bold ? 'ThaiBold' : 'Thai').fontSize(12);
      doc.text(label, sumX, doc.y, { continued: false });
      doc.text(value, valX, doc.y - lineH, { width: 65, align: 'right' });
    };

    doc.moveDown(0.5);
    summaryLine('รวมเป็นเงิน', fmtNumber(totalAmount));
    if (discount > 0) {
      summaryLine(`ส่วนลด ${discount}%`, `-${fmtNumber(discountAmt)}`);
      summaryLine('ราคาหลังหักส่วนลด', fmtNumber(afterDiscount));
    }
    if (vatEnabled) {
      summaryLine('ภาษีมูลค่าเพิ่ม 7%', fmtNumber(vatAmt));
    }
    summaryLine('จำนวนเงินรวมทั้งสิ้น', fmtNumber(grandTotal), true);
    if (whTaxPct > 0) {
      summaryLine(`หักภาษี ณ ที่จ่าย ${whTaxPct}%`, `-${fmtNumber(whTaxAmt)}`);
    }

    // ── Notes ──
    if ((quotation as any).notes) {
      doc.moveDown(1.5);
      doc.font('ThaiBold').fontSize(12).text('หมายเหตุ:', 50);
      doc.font('Thai').fontSize(11).text((quotation as any).notes, 50, doc.y, { width: pageW });
    }

    doc.end();
  } catch (err) {
    console.error('PDF generation error:', err);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Failed to generate PDF' });
    }
  }
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

  const cleanData: Record<string, unknown> = Object.fromEntries(
    Object.entries(parsed.data).filter(([_, v]) => v !== undefined)
  );

  // Convert date strings to Date objects for Prisma
  if (typeof cleanData.quotationDate === 'string') {
    cleanData.quotationDate = new Date(cleanData.quotationDate);
  }
  if (typeof cleanData.dueDate === 'string') {
    cleanData.dueDate = new Date(cleanData.dueDate);
  }

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
