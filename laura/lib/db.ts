import { PrismaClient } from "@/lib/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

// Standard Next.js pattern: reuse one client across hot-reloads in dev
// instead of opening a new one per edit, which otherwise exhausts
// connections quickly.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// SQLite via a local file -- fine for local dev, but a serverless host's
// filesystem isn't durable across deploys/invocations. Swapping the
// adapter for @prisma/adapter-libsql (Turso) before deploying for real
// is a one-line change, no schema changes needed.
const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL! });

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
