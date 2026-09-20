import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // `prisma generate` (postinstall) must not require .env; migrate/seed still do.
    url:
      process.env.DATABASE_URL ??
      (process.argv.includes("generate")
        ? "postgresql://postgres:postgres@127.0.0.1:1/prisma_generate"
        : env("DATABASE_URL")),
  },
});
