import { execFileSync } from "node:child_process";
import { config } from "dotenv";
import { Client } from "pg";
import { getTestDatabaseUrl } from "./database-url";

export default async function globalSetup() {
  config({ path: ".env", quiet: true });

  const testDatabaseUrl = getTestDatabaseUrl();
  const testUrl = new URL(testDatabaseUrl);
  const databaseName = decodeURIComponent(testUrl.pathname.slice(1));

  if (!/^[A-Za-z0-9_-]+$/.test(databaseName)) {
    throw new Error("Test database name contains unsupported characters.");
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
    env: { ...process.env, DATABASE_URL: testDatabaseUrl },
    stdio: "inherit",
  });
}
