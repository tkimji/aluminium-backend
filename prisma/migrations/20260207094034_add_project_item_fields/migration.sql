-- AlterTable
ALTER TABLE "ProjectItem" ADD COLUMN     "color_id" TEXT,
ADD COLUMN     "glass_height" INTEGER,
ADD COLUMN     "glass_quantity" INTEGER,
ADD COLUMN     "glass_thickness_mm" DOUBLE PRECISION,
ADD COLUMN     "glass_width" INTEGER,
ADD COLUMN     "length" INTEGER,
ADD COLUMN     "panel_count" INTEGER,
ADD COLUMN     "product_id" TEXT;

-- AddForeignKey
ALTER TABLE "ProjectItem" ADD CONSTRAINT "ProjectItem_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectItem" ADD CONSTRAINT "ProjectItem_color_id_fkey" FOREIGN KEY ("color_id") REFERENCES "Color"("id") ON DELETE SET NULL ON UPDATE CASCADE;
