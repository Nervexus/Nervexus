-- CreateTable
CREATE TABLE "Shift" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "startAt" DATETIME NOT NULL,
    "endAt" DATETIME NOT NULL,
    "location" TEXT,
    "colleagues" TEXT,
    "note" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "commutePlan" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'me',
    "homeAddress" TEXT,
    "workAddress" TEXT,
    "arrivalBufferMinutes" INTEGER NOT NULL DEFAULT 15,
    "updatedAt" DATETIME NOT NULL
);
