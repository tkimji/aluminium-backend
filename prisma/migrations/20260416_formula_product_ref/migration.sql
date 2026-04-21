ALTER TABLE "Formula" ADD COLUMN "product_id" TEXT;

ALTER TABLE "Formula"
  ADD CONSTRAINT "Formula_product_id_fkey"
  FOREIGN KEY ("product_id") REFERENCES "Product"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
