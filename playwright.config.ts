import { defineConfig, devices } from "@playwright/test";
import { config } from "dotenv";
import { getE2eDatabaseUrl } from "./tests/database-url";

config({ path: ".env", quiet: true });

const e2eDatabaseUrl = getE2eDatabaseUrl();
const e2eJwtSecret = "e2e-test-jwt-secret-that-is-at-least-32-chars";

process.env.DATABASE_URL = e2eDatabaseUrl;
process.env.JWT_SECRET = e2eJwtSecret;
process.env.AUTH_COOKIE_SECURE = "false";
process.env.ADMIN_EMAIL ??= "admin@example.com";
process.env.ADMIN_PASSWORD ??= "change-me";

const port = Number(process.env.E2E_PORT ?? 3100);
const baseURL = `http://localhost:${port}`;
const authFile = "e2e/.auth/user.json";

const e2eEnv = {
  ...process.env,
  DATABASE_URL: e2eDatabaseUrl,
  JWT_SECRET: e2eJwtSecret,
  AUTH_COOKIE_SECURE: "false",
  NODE_ENV: "production",
};

/**
 * Chromium only: this suite targets cookie, redirect, cache, XSS, and layout
 * behavior that does not depend on engine-specific APIs. One browser keeps the
 * run cheaper and more stable; Firefox/WebKit can be added later if needed.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  forbidOnly: Boolean(process.env.CI),
  reporter: [["list"], ["html", { open: "never" }]],
  globalSetup: "./e2e/global-setup.ts",
  outputDir: "test-results",
  use: {
    baseURL,
    locale: "uk-UA",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: `npx tsx e2e/prepare-db.ts && npm run build && npx next start --port ${port}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    stdout: "pipe",
    stderr: "pipe",
    env: e2eEnv,
  },
  projects: [
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 800 },
      },
    },
    {
      name: "desktop",
      dependencies: ["setup"],
      testMatch: /tests\/.*\.spec\.ts/,
      grepInvert: /@mobile-only/,
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 800 },
        storageState: authFile,
      },
    },
    {
      name: "mobile",
      dependencies: ["setup"],
      testMatch: /tests\/.*\.spec\.ts/,
      grep: /@mobile/,
      use: {
        ...devices["iPhone 12"],
        viewport: { width: 375, height: 812 },
        hasTouch: true,
        isMobile: true,
        browserName: "chromium",
        storageState: authFile,
      },
    },
  ],
});
