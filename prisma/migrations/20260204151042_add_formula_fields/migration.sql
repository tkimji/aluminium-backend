-- AlterTable
ALTER TABLE "Formula" ADD COLUMN     "product_type_id" TEXT,
ADD COLUMN     "production_quantity" INTEGER,
ADD COLUMN     "sequence_number" INTEGER,
ADD COLUMN     "unit_id" TEXT;

-- AddForeignKey
ALTER TABLE "Formula" ADD CONSTRAINT "Formula_product_type_id_fkey" FOREIGN KEY ("product_type_id") REFERENCES "ProductType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Formula" ADD CONSTRAINT "Formula_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "Unit"("id") ON DELETE SET NULL ON UPDATE CASCADE;
