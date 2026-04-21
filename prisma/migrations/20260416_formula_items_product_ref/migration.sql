-- Delete existing FormulaItem rows (switching FK target from AluminiumItem to Product)
DELETE FROM "FormulaItem";

-- Drop old FK
ALTER TABLE "FormulaItem" DROP CONSTRAINT IF EXISTS "FormulaItem_aluminium_item_id_fkey";

-- Rename column aluminium_item_id -> product_id
ALTER TABLE "FormulaItem" RENAME COLUMN "aluminium_item_id" TO "product_id";

-- Add new FK to Product
ALTER TABLE "FormulaItem" ADD CONSTRAINT "FormulaItem_product_id_fkey"
  FOREIGN KEY ("product_id") REFERENCES "Product"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
