import { createClient } from "@libsql/client";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import "dotenv/config";

const __dirname = dirname(fileURLToPath(import.meta.url));

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const sql = readFileSync(
  join(__dirname, "../prisma/migrations/20261020195039_init/migration.sql"),
  "utf8"
);

const sqlWithoutComments = sql
  .split("\n")
  .filter((line) => !line.trim().startsWith("--"))
  .join("\n");

const statements = sqlWithoutComments
  .split(";")
  .map((s) => s.trim())
  .filter((s) => s.length > 0)
  .map((s) => s + ";");

for (const stmt of statements) {
  console.log("Executing:\n" + stmt);
  await client.execute(stmt);
}

const tables = await client.execute(
  "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"
);
console.log(
  "Tables now in Turso DB:",
  tables.rows.map((r) => r.name)
);

client.close();
