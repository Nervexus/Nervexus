-- CreateTable
CREATE TABLE "NoteFolder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "pinHash" TEXT,
    "pinSalt" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- Seed the folder every pre-existing note moves into
INSERT INTO "NoteFolder" ("id", "name", "locked", "updatedAt") VALUES ('default', 'Notes', false, CURRENT_TIMESTAMP);

-- AlterTable
ALTER TABLE "Note" ADD COLUMN "folderId" TEXT NOT NULL DEFAULT 'default';

-- CreateIndex
CREATE INDEX "Note_folderId_idx" ON "Note"("folderId");
