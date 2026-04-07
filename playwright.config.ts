import { defineConfig } from "@playwright/test";

const PORT = process.env.PORT ?? "3000";
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  webServer: {
    command: process.env.CI
      ? `pnpm build && pnpm start --port ${PORT}`
      : `pnpm dev --port ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      MOCK_AI: process.env.MOCK_AI ?? "0",
      PORT,
    },
  },
  use: { baseURL: BASE_URL },
});
