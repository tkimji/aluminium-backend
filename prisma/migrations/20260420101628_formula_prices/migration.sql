/*
  Warnings:

  - You are about to alter the column `product_price` on the `Formula` table. The data in that column could be lost. The data in that column will be cast from `Decimal` to `Decimal(65,30)`.
  - You are about to alter the column `total_price` on the `Formula` table. The data in that column could be lost. The data in that column will be cast from `Decimal` to `Decimal(65,30)`.
  - You are about to alter the column `price` on the `ProjectItem` table. The data in that column could be lost. The data in that column will be cast from `Decimal` to `Decimal(65,30)`.

*/
-- AlterTable
ALTER TABLE "Formula" ALTER COLUMN "product_price" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "total_price" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "ProjectItem" ALTER COLUMN "price" SET DATA TYPE DECIMAL(65,30);
