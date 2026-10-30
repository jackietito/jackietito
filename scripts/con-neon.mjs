// Ejecuta un comando con las variables de Neon de .env.neon
// (DATABASE_URL con pooling y DATABASE_URL_UNPOOLED directa).
// Uso: node scripts/con-neon.mjs "<comando>"
// Las variables de Neon se guardan en .env.neon y no en .env/.env.local para
// que el desarrollo local siga usando SQLite (decisión D15).
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";

if (!existsSync(".env.neon")) {
  console.error("No existe .env.neon. Ejecuta: npm run neon:env");
  process.exit(1);
}
process.loadEnvFile(".env.neon");
const comando = process.argv.slice(2).join(" ");
const r = spawnSync(comando, { stdio: "inherit", shell: true, env: process.env });
process.exit(r.status ?? 1);
