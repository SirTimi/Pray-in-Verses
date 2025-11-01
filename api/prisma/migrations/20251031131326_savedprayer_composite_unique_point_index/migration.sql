/*
  Warnings:

  - A unique constraint covering the columns `[userId,curatedPrayerId,pointIndex]` on the table `SavedPrayer` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."SavedPrayer_userId_curatedPrayerId_key";

-- CreateIndex
CREATE UNIQUE INDEX "SavedPrayer_userId_curatedPrayerId_pointIndex_key" ON "SavedPrayer"("userId", "curatedPrayerId", "pointIndex");
