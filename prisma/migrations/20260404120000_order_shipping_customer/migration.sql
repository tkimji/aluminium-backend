-- AlterTable: Order — shipping snapshot + customer when no project
-- Tables use Prisma defaults: "Order", "User" (quoted PascalCase).

ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "customer_user_id" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "ship_house_no" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "ship_moo" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "ship_building" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "ship_soi" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "ship_road" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "ship_province" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "ship_district" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "ship_subdistrict" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "ship_postal_code" TEXT;

-- Idempotent FK (avoids broken "IF NOT EXISTS ( SELECT ... SELECT ... )" syntax)
ALTER TABLE "Order" DROP CONSTRAINT IF EXISTS "Order_customer_user_id_fkey";

ALTER TABLE "Order"
  ADD CONSTRAINT "Order_customer_user_id_fkey"
  FOREIGN KEY ("customer_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
