import { defineConfig, devices } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const backendDir = path.resolve(root, "../ecommerce_backend");
const frontendDir = path.resolve(root, "../ecommerce_frontend");
const adminDir = path.resolve(root, "../ecommerce_admin");

export default defineConfig({
  testDir: "./tests",
  globalSetup: "./global-setup.ts",
  timeout: 180_000,
  expect: { timeout: 30_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: "list",
  use: {
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      // System Chrome — Playwright's bundled Chromium CDN is geo-blocked here.
      use: { ...devices["Desktop Chrome"], channel: "chrome" },
    },
  ],
  webServer: [
    {
      command: "node zibal-stub.mjs",
      cwd: root,
      url: "http://127.0.0.1:4010/health",
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
    {
      command: "bun run dev",
      cwd: backendDir,
      url: "http://127.0.0.1:9000/api/v1/site-settings",
      // Must start with stub Zibal URLs — never reuse a normal API on :9000.
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        ...process.env,
        ZIBAL_REQUEST_API_URL: "http://127.0.0.1:4010/v1/request",
        ZIBAL_VERIFY_API_URL: "http://127.0.0.1:4010/v1/verify",
        ZIBAL_MERCHANT_ID: "zibal",
      },
    },
    {
      command: "pnpm dev",
      cwd: frontendDir,
      url: "http://127.0.0.1:3000",
      reuseExistingServer: true,
      timeout: 180_000,
    },
    {
      command: "pnpm dev",
      cwd: adminDir,
      url: "http://127.0.0.1:5173",
      reuseExistingServer: true,
      timeout: 120_000,
    },
  ],
});
