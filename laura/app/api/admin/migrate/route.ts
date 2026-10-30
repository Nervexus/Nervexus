import { NextRequest, NextResponse } from "next/server";
import { createHash, randomUUID } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@libsql/client";

// Applies database migrations that ship with the app but aren't on the live
// database yet, using the app's own database connection -- so no one has to
// handle the database password to roll out a change. Locked to
// CRON_SECRET. Only migrations newer than BASELINE are considered (every
// older one was applied by hand and recorded), and only the SQL files in
// prisma/migrations can run -- nothing from the request body.
const BASELINE = "20261028120000_add_routine_item";

export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dir = join(process.cwd(), "prisma", "migrations");
  const names = readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name > BASELINE)
    .map((d) => d.name)
    .sort();

  const db = createClient({ url: process.env.TURSO_DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN });
  try {
    const done = new Set(
      (await db.execute(`SELECT "migration_name" FROM "_prisma_migrations"`)).rows.map((r) => String(r.migration_name))
    );
    const applied: string[] = [];
    for (const name of names) {
      if (done.has(name)) continue;
      const sql = readFileSync(join(dir, name, "migration.sql"), "utf8");
      await db.executeMultiple(sql);
      await db.execute({
        sql: `INSERT INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "started_at", "applied_steps_count") VALUES (?, ?, CURRENT_TIMESTAMP, ?, CURRENT_TIMESTAMP, 1)`,
        args: [randomUUID(), createHash("sha256").update(sql).digest("hex"), name],
      });
      applied.push(name);
    }
    return NextResponse.json({ applied, alreadyApplied: names.filter((n) => !applied.includes(n)) });
  } catch (err) {
    console.error("migrate failed:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Migration failed." }, { status: 500 });
  } finally {
    db.close();
  }
}
