/*
  Warnings:

  - You are about to drop the column `product_id` on the `FormulaItem` table. All the data in the column will be lost.
  - Added the required column `aluminium_item_id` to the `FormulaItem` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "FormulaItem" DROP CONSTRAINT "FormulaItem_product_id_fkey";

-- AlterTable
ALTER TABLE "FormulaItem" DROP COLUMN "product_id",
ADD COLUMN     "aluminium_item_id" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "AluminiumItem" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "image_path" TEXT,
    "status" "ProductStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AluminiumItem_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "FormulaItem" ADD CONSTRAINT "FormulaItem_aluminium_item_id_fkey" FOREIGN KEY ("aluminium_item_id") REFERENCES "AluminiumItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
