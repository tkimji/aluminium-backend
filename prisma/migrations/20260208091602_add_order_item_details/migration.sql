-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "brand_id" TEXT,
ADD COLUMN     "color_id" TEXT,
ADD COLUMN     "height" INTEGER,
ADD COLUMN     "thickness" DOUBLE PRECISION,
ADD COLUMN     "width" INTEGER;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_color_id_fkey" FOREIGN KEY ("color_id") REFERENCES "Color"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;
