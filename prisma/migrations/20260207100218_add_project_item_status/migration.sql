-- CreateEnum
CREATE TYPE "ProjectItemStatus" AS ENUM ('DRAFT', 'IN_CART', 'QUOTED');

-- AlterTable
ALTER TABLE "ProjectItem" ADD COLUMN     "status" "ProjectItemStatus" NOT NULL DEFAULT 'DRAFT';
