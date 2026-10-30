-- CreateTable
CREATE TABLE "OutreachEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "leadId" TEXT,
    "leadName" TEXT,
    "company" TEXT,
    "preview" TEXT,
    "status" TEXT,
    "at" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "OutreachEvent_at_idx" ON "OutreachEvent"("at");
