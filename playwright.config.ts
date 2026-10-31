import { defineConfig, devices } from "@playwright/test";

// Las pruebas usan una base SQLite propia (prisma/e2e.db) que se recarga con el seed
// cada vez que se levanta el servidor de pruebas.
const PUERTO = 3100;
const env = { DATABASE_URL: "file:./e2e.db", SESSION_SECRET: "clave-de-pruebas-e2e", CLAVE_RESTABLECER: "clave-restablecer-e2e" };

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  timeout: 60_000,
  use: {
    baseURL: `http://localhost:${PUERTO}`,
    locale: "es-PE",
    timezoneId: "America/Lima",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "escritorio", use: { ...devices["Desktop Chrome"] } },
    { name: "movil", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: `node scripts/prisma-provider.mjs && prisma db push --skip-generate && tsx prisma/seed.ts && next build && next start -p ${PUERTO}`,
    url: `http://localhost:${PUERTO}`,
    env,
    timeout: 300_000,
    reuseExistingServer: !process.env.CI,
  },
});
