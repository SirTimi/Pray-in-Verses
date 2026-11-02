-- Prayer Wall reporting, blocking and moderated visibility.
CREATE TYPE "PrayerReportTarget" AS ENUM ('REQUEST', 'COMMENT');
CREATE TYPE "PrayerReportReason" AS ENUM ('HARASSMENT', 'HATE', 'THREATS', 'SPAM', 'PRIVACY', 'OTHER');
CREATE TYPE "PrayerReportStatus" AS ENUM ('PENDING', 'HIDDEN', 'DISMISSED');

ALTER TABLE "PrayerRequest" ADD COLUMN "hidden" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "PrayerComment" ADD COLUMN "hidden" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "PrayerReport" (
  "id" TEXT NOT NULL,
  "reporterId" TEXT NOT NULL,
  "targetType" "PrayerReportTarget" NOT NULL,
  "targetId" TEXT NOT NULL,
  "reason" "PrayerReportReason" NOT NULL,
  "details" TEXT,
  "status" "PrayerReportStatus" NOT NULL DEFAULT 'PENDING',
  "reviewedById" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PrayerReport_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PrayerReport_reporterId_targetType_targetId_key" ON "PrayerReport"("reporterId", "targetType", "targetId");
CREATE INDEX "PrayerReport_status_createdAt_idx" ON "PrayerReport"("status", "createdAt");
CREATE INDEX "PrayerReport_targetType_targetId_idx" ON "PrayerReport"("targetType", "targetId");
ALTER TABLE "PrayerReport" ADD CONSTRAINT "PrayerReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PrayerReport" ADD CONSTRAINT "PrayerReport_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "UserBlock" (
  "id" TEXT NOT NULL,
  "blockerId" TEXT NOT NULL,
  "blockedId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserBlock_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "UserBlock_blockerId_blockedId_key" ON "UserBlock"("blockerId", "blockedId");
CREATE INDEX "UserBlock_blockedId_idx" ON "UserBlock"("blockedId");
ALTER TABLE "UserBlock" ADD CONSTRAINT "UserBlock_blockerId_fkey" FOREIGN KEY ("blockerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserBlock" ADD CONSTRAINT "UserBlock_blockedId_fkey" FOREIGN KEY ("blockedId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
