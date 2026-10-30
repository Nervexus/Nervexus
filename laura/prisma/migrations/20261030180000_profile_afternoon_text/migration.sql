-- AlterTable
ALTER TABLE "Profile" ADD COLUMN "afternoonOn" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Profile" ADD COLUMN "afternoonTime" TEXT NOT NULL DEFAULT '14:00';
ALTER TABLE "Profile" ADD COLUMN "lastAfternoonOn" TEXT;
