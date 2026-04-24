-- Manual patch: Order shipping + customer_user_id (same as Prisma migration 20260404120000_order_shipping_customer)
--
-- Common mistake to avoid:
--   IF NOT EXISTS ( SELECT ... ; SELECT ... )  -- INVALID: two SELECTs need OR / UNION
--   Mixing "orders"/"users" with Prisma's "Order"/"User" tables -- INVALID for this schema
--
-- Run: psql "$DATABASE_URL" -f DB/patch_order_shipping_customer_plain.sql

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

ALTER TABLE "Order" DROP CONSTRAINT IF EXISTS "Order_customer_user_id_fkey";

ALTER TABLE "Order"
  ADD CONSTRAINT "Order_customer_user_id_fkey"
  FOREIGN KEY ("customer_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
