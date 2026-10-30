// Ajusta el proveedor de Prisma según DATABASE_URL.
// - file:...            -> sqlite (desarrollo local)
// - postgres(ql)://...  -> postgresql (despliegue en Vercel + Neon)
// Prisma no permite leer el proveedor desde una variable de entorno,
// por eso se reescribe la línea del datasource antes de "prisma generate".
import { readFileSync, writeFileSync, existsSync } from "node:fs";

if (!process.env.DATABASE_URL && existsSync(".env")) {
  const linea = readFileSync(".env", "utf8")
    .split("\n")
    .find((l) => l.startsWith("DATABASE_URL="));
  if (linea) process.env.DATABASE_URL = linea.slice("DATABASE_URL=".length).replace(/^"|"$/g, "");
}

const url = process.env.DATABASE_URL ?? "";
const proveedor = /^postgres(ql)?:\/\//.test(url) ? "postgresql" : "sqlite";
const ruta = "prisma/schema.prisma";
const esquema = readFileSync(ruta, "utf8");
const nuevo = esquema.replace(
  /(datasource db \{\s*provider\s*=\s*)"[a-z]+"/,
  `$1"${proveedor}"`,
);
if (nuevo !== esquema) writeFileSync(ruta, nuevo);
console.log(`Prisma: proveedor ${proveedor}`);
