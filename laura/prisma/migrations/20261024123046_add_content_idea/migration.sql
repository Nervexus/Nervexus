-- CreateTable
CREATE TABLE "ContentIdea" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL DEFAULT 'post',
    "title" TEXT NOT NULL,
    "caption" TEXT,
    "hashtags" TEXT,
    "location" TEXT,
    "outfit" TEXT,
    "scheduledAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'idea',
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
