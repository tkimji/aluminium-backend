-- AlterTable
ALTER TABLE "Quotation" ADD COLUMN     "credit_days" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "discount" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "due_date" TIMESTAMP(3),
ADD COLUMN     "employee_name" TEXT,
ADD COLUMN     "internal_notes" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "quotation_date" TIMESTAMP(3),
ADD COLUMN     "reference_no" TEXT,
ADD COLUMN     "vat_enabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "withholding_tax_percent" DECIMAL(65,30) NOT NULL DEFAULT 0;
