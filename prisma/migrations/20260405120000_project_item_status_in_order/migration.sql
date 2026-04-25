-- AlterEnum: line items moved from cart into a placed order (appends after existing values)
ALTER TYPE "ProjectItemStatus" ADD VALUE 'IN_ORDER';
