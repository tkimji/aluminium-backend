import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const now = new Date();
const addDays = (days: number) => new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

const getOrCreateWarehouse = async (code: string, name: string) => {
  const existing = await prisma.warehouse.findFirst({ where: { code } });
  if (existing) return existing;
  return prisma.warehouse.create({ data: { code, name } });
};

const getOrCreateByName = async <T>(
  find: () => Promise<T | null>,
  create: () => Promise<T>
) => {
  const existing = await find();
  if (existing) return existing;
  return create();
};

async function main() {
  const passwordHash = await bcrypt.hash('123456', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@demo.com' },
    update: {
      passwordHash: passwordHash
    },
    create: {
      email: 'admin@demo.com',
      passwordHash,
      role: 'admin',
      status: 'active',
      profile: {
        create: {
          firstName: 'Admin',
          lastName: 'Demo',
        },
      },
    },
    include: { profile: true },
  });

  const user = await prisma.user.upsert({
    where: { email: 'user@demo.com' },
    update: {},
    create: {
      email: 'user@demo.com',
      passwordHash,
      role: 'user',
      status: 'active',
      profile: {
        create: {
          firstName: 'User',
          lastName: 'Demo',
        },
      },
    },
    include: { profile: true },
  });

  const tech = await prisma.user.upsert({
    where: { email: 'tech@demo.com' },
    update: {},
    create: {
      email: 'tech@demo.com',
      passwordHash,
      role: 'tech',
      status: 'active',
      profile: {
        create: {
          firstName: 'Tech',
          lastName: 'Demo',
        },
      },
    },
    include: { profile: true },
  });

  const approval = await getOrCreateByName(
    () => prisma.adminApproval.findFirst({
      where: { userId: tech.id, type: 'tech_registration' },
    }),
    () => prisma.adminApproval.create({
      data: {
        userId: tech.id,
        type: 'tech_registration',
        status: 'approved',
        approvedBy: admin.id,
        approvedAt: now,
      },
    })
  );

  const subscription = await getOrCreateByName(
    () => prisma.subscription.findFirst({ where: { userId: tech.id } }),
    () => prisma.subscription.create({
      data: {
        userId: tech.id,
        plan: 'monthly',
        status: 'active',
        startAt: now,
        endAt: addDays(30),
      },
    })
  );

  await getOrCreateByName(
    () => prisma.subscriptionPayment.findFirst({ where: { subscriptionId: subscription.id } }),
    () => prisma.subscriptionPayment.create({
      data: {
        subscriptionId: subscription.id,
        slipUrl: '/uploads/demo-slip.png',
        status: 'approved',
        approvedBy: admin.id,
        approvedAt: now,
      },
    })
  );

  const productType = await getOrCreateByName(
    () => prisma.productType.findFirst({ where: { name: 'ประตู' } }),
    () => prisma.productType.create({ data: { code: 'DR', name: 'ประตู' } })
  );

  const unit = await getOrCreateByName(
    () => prisma.unit.findFirst({ where: { name: 'ชิ้น' } }),
    () => prisma.unit.create({ data: { code: 'PCS', name: 'ชิ้น' } })
  );

  const brand = await getOrCreateByName(
    () => prisma.brand.findFirst({ where: { name: 'MCK Thailand' } }),
    () => prisma.brand.create({ data: { code: 'MCK', name: 'MCK Thailand' } })
  );

  await getOrCreateByName(
    () => prisma.color.findFirst({ where: { name: 'ดำ' } }),
    () => prisma.color.create({ data: { code: '000000', name: 'ดำ' } })
  );

  const glassType = await getOrCreateByName(
    () => prisma.glassType.findFirst({ where: { name: 'กระจกใส' } }),
    () => prisma.glassType.create({ data: { code: 'GL-CL', name: 'กระจกใส' } })
  );

  const glassThickness = await getOrCreateByName(
    () => prisma.glassThickness.findFirst({ where: { thicknessMm: 6 } }),
    () => prisma.glassThickness.create({ data: { code: 'TH-6', thicknessMm: 6 } })
  );

  const warehouse = await getOrCreateWarehouse('WH-01', 'คลัง 1');

  const aluMaterial = await prisma.product.upsert({
    where: { sku: 'ALU-001' },
    update: {},
    create: {
      sku: 'ALU-001',
      name: 'อลูมิเนียมโปรไฟล์',
      itemFormat: 'MATERIAL',
      productTypeId: productType.id,
      unitId: unit.id,
      brandId: brand.id,
      warehouseId: warehouse.id,
      priceManual: 100,
      priceSource: 'MANUAL',
      status: 'active',
    },
  });

  const presetProduct = await prisma.product.upsert({
    where: { sku: 'WIN-001' },
    update: {},
    create: {
      sku: 'WIN-001',
      name: 'หน้าต่างบานเลื่อน',
      itemFormat: 'PRESET',
      productTypeId: productType.id,
      unitId: unit.id,
      brandId: brand.id,
      warehouseId: warehouse.id,
      priceManual: 1500,
      priceSource: 'MANUAL',
      status: 'active',
      description: 'หน้าต่างสำเร็จรูป',
    },
  });

  await getOrCreateByName(
    () => prisma.inventory.findFirst({ where: { productId: presetProduct.id, warehouseId: warehouse.id } }),
    () => prisma.inventory.create({
      data: {
        productId: presetProduct.id,
        warehouseId: warehouse.id,
        qtyOnHand: 50,
        lowStockThreshold: 5,
      },
    })
  );

  const formula = await getOrCreateByName(
    () => prisma.formula.findFirst({ where: { code: 'ALU-F-001' } }),
    () => prisma.formula.create({
      data: {
        code: 'ALU-F-001',
        name: 'สูตรประตู 1',
        standardWidth: 1000,
        standardHeight: 2000,
        standardLength: 100,
        glassTypeId: glassType.id,
        glassThicknessId: glassThickness.id,
      },
    })
  );

  // Commented out - will seed AluminiumItem and FormulaItem later
  /* 
  await getOrCreateByName(
    () => prisma.formulaItem.findFirst({ where: { formulaId: formula.id, aluminiumItemId: aluMaterial.id } }),
    () => prisma.formulaItem.create({
      data: {
        formulaId: formula.id,
        aluminiumItemId: aluMaterial.id,
        position: 'บานซ้าย',
        lengthMm: 2300,
        qty: 2,
        totalLengthMm: 4600,
        angle: '90°',
      },
    })
  );
  */

  await prisma.product.upsert({
    where: { sku: 'MTO-001' },
    update: {},
    create: {
      sku: 'MTO-001',
      name: 'ประตูตามสั่ง',
      itemFormat: 'MTO',
      productTypeId: productType.id,
      unitId: unit.id,
      brandId: brand.id,
      warehouseId: warehouse.id,
      priceSource: 'FORMULA',
      formulaId: formula.id,
      status: 'active',
    },
  });

  await prisma.notification.create({
    data: {
      userId: tech.id,
      message: 'บัญชีของคุณได้รับการอนุมัติแล้ว',
      tone: 'green',
      status: 'unread',
    },
  });

  console.log('Seed completed');
  console.log({ admin: admin.email, user: user.email, tech: tech.email, approval: approval.id });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
