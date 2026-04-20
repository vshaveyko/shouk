import { defineConfig, devices } from "@playwright/test";

const PORT = process.env.PORT ?? "3100";
const BASE_URL = process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  fullyParallel: false, // share a single DB across workers via serial execution
  workers: 1,
  reporter: [["html", { open: "never" }], ["list"]],
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 10_000,
    navigationTimeout: 20_000,
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: process.env.E2E_NO_WEBSERVER
    ? undefined
    : {
        command: "npm run dev -- -p " + PORT,
        url: BASE_URL,
        timeout: 120_000,
        reuseExistingServer: !process.env.CI,
        env: {
          DATABASE_URL: process.env.DATABASE_URL ?? "",
          NEXTAUTH_URL: BASE_URL,
          NEXTAUTH_SECRET: "e2e-secret-key",
          AUTH_SECRET: "e2e-secret-key",
          AUTH_GOOGLE_ID: "",
          AUTH_GOOGLE_SECRET: "",
          NODE_ENV: "test",
        },
      },
});
