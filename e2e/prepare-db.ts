import { mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { config } from "dotenv";
import { Client } from "pg";
import { getE2eDatabaseUrl } from "../tests/database-url";

export async function prepareE2eDatabase(): Promise<string> {
  config({ path: ".env", quiet: true });

  process.env.ADMIN_EMAIL ??= "admin@example.com";
  process.env.ADMIN_PASSWORD ??= "change-me";

  const e2eDatabaseUrl = getE2eDatabaseUrl();
  process.env.DATABASE_URL = e2eDatabaseUrl;

  const testUrl = new URL(e2eDatabaseUrl);
  const databaseName = decodeURIComponent(testUrl.pathname.slice(1));

  if (!/^[A-Za-z0-9_-]+$/.test(databaseName)) {
    throw new Error("E2E database name contains unsupported characters.");
  }

  const maintenanceUrl = new URL(testUrl);
  maintenanceUrl.pathname = "/postgres";
  maintenanceUrl.search = "";

  const client = new Client({ connectionString: maintenanceUrl.toString() });
  await client.connect();

  try {
    const result = await client.query<{ exists: boolean }>(
      "SELECT EXISTS(SELECT 1 FROM pg_database WHERE datname = $1) AS exists",
      [databaseName],
    );

    if (!result.rows[0]?.exists) {
      await client.query(`CREATE DATABASE "${databaseName}"`);
    }
  } finally {
    await client.end();
  }

  execFileSync("npm", ["exec", "--", "prisma", "migrate", "deploy"], {
    env: { ...process.env, DATABASE_URL: e2eDatabaseUrl },
    stdio: "inherit",
  });

  execFileSync("npm", ["exec", "--", "prisma", "db", "seed"], {
    env: { ...process.env, DATABASE_URL: e2eDatabaseUrl },
    stdio: "inherit",
  });

  mkdirSync("e2e/.auth", { recursive: true });
  return e2eDatabaseUrl;
}

const invokedDirectly = process.argv[1]
  ?.replaceAll("\\", "/")
  .includes("e2e/prepare-db");

if (invokedDirectly) {
  prepareE2eDatabase().catch((error: unknown) => {
    console.error(
      error instanceof Error ? error.message : "E2E database setup failed.",
    );
    process.exitCode = 1;
  });
}
