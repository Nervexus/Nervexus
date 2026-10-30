import { PrismaClient } from "@/lib/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

// Standard Next.js pattern: reuse one client across hot-reloads in dev
// instead of opening a new one per edit, which otherwise exhausts
// connections quickly.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Turso (hosted, SQLite-wire-compatible) -- used for local dev and
// production alike, so there's one storage path to test instead of two.
const adapter = new PrismaLibSql({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
