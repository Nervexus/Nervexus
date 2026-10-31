-- AlterTable
ALTER TABLE "ApiKey" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'ok';
ALTER TABLE "ApiKey" ADD COLUMN "until" DATETIME;
ALTER TABLE "ApiKey" ADD COLUMN "error" TEXT;
ALTER TABLE "ApiKey" ADD COLUMN "info" TEXT;
ALTER TABLE "ApiKey" ADD COLUMN "lastUsed" DATETIME;
ALTER TABLE "ApiKey" ADD COLUMN "uses" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "ServiceHealth" (
    "service" TEXT NOT NULL PRIMARY KEY,
    "lastOk" DATETIME,
    "lastError" DATETIME,
    "error" TEXT,
    "fails" INTEGER NOT NULL DEFAULT 0,
    "cooldownUntil" DATETIME
);

-- CreateTable
CREATE TABLE "ApiIssue" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ikey" TEXT NOT NULL,
    "service" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "needsKey" BOOLEAN NOT NULL,
    "resetAt" DATETIME,
    "firstSeen" DATETIME NOT NULL,
    "lastSeen" DATETIME NOT NULL,
    "resolvedAt" DATETIME,
    "snoozeUntil" DATETIME
);

-- CreateIndex
CREATE INDEX "ApiIssue_resolvedAt_idx" ON "ApiIssue"("resolvedAt");
