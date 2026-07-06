/**
 * Aplica 003_centro_multiespacio.sql vía conexión Postgres.
 * Requiere en .env.local:
 *   SUPABASE_DB_PASSWORD=...  (Settings → Database → password)
 */

import { existsSync, readFileSync } from "fs";
import { join } from "path";
import pg from "pg";

const { Client } = pg;

function loadEnvLocal() {
  const path = join(process.cwd(), ".env.local");
  if (!existsSync(path)) {
    console.error("No se encontró .env.local");
    process.exit(1);
  }
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

async function main() {
  loadEnvLocal();

  const password = process.env.SUPABASE_DB_PASSWORD;
  const ref = "nfioruduozgqtggezyhd";

  if (!password) {
    console.error(
      "Añade SUPABASE_DB_PASSWORD a .env.local (Supabase → Settings → Database)"
    );
    process.exit(1);
  }

  const connectionString =
    process.env.DATABASE_URL ||
    `postgresql://postgres.${ref}:${encodeURIComponent(password)}@aws-0-eu-west-1.pooler.supabase.com:6543/postgres`;

  const sql = readFileSync(
    join(process.cwd(), "supabase/migrations/003_centro_multiespacio.sql"),
    "utf8"
  );

  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });

  try {
    await client.connect();
    await client.query(sql);
    console.log("✓ Migración 003 aplicada correctamente.");
  } catch (err) {
    console.error("Error aplicando migración:", err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
