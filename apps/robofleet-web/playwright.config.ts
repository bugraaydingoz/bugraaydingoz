import process from "node:process";
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testMatch: "src/**/*.e2e.ts",
  webServer: [
    {
      command: "pnpm --filter robofleet-api build && pnpm --filter robofleet-api start",
      url: "http://127.0.0.1:3031/api/health",
      env: { PORT: "3031" },
      reuseExistingServer: !process.env.CI,
    },
    {
      command: "pnpm build && pnpm preview --host 127.0.0.1 --port 4174 --strictPort",
      url: "http://127.0.0.1:4174",
      env: { ROBOFLEET_API_URL: "http://127.0.0.1:3031" },
      reuseExistingServer: !process.env.CI,
    },
  ],
  use: {
    baseURL: "http://127.0.0.1:4174",
    browserName: "chromium",
    trace: "retain-on-failure",
  },
});
