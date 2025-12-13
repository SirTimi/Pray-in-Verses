-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('DRAFT', 'SENT');

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "status" "NotificationStatus" NOT NULL DEFAULT 'SENT';
