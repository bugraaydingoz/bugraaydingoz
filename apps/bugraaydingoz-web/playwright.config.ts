import { defineConfig } from "@playwright/test";

export default defineConfig({
    testMatch: "**/*.e2e.ts",
    webServer: {
        command:
            "pnpm build && pnpm preview --host 127.0.0.1 --port 4324",
        port: 4324,
        reuseExistingServer: !process.env.CI,
    },
    use: {
        baseURL: "http://127.0.0.1:4324",
    },
});
