// Ajusta el datasource de Prisma según DATABASE_URL.
// - file:...            -> sqlite (desarrollo local y pruebas E2E)
// - postgres(ql)://...  -> postgresql (Neon / Vercel), con directUrl
// Prisma no permite leer el proveedor desde una variable de entorno,
// por eso se reescribe el bloque del datasource antes de "prisma generate".
// En PostgreSQL, DATABASE_URL es la cadena con pooling (la usa la app) y
// DATABASE_URL_UNPOOLED la directa (la usa "prisma db push"). Ver D02 y D15.
import { readFileSync, writeFileSync, existsSync } from "node:fs";

if (!process.env.DATABASE_URL && existsSync(".env")) {
  const linea = readFileSync(".env", "utf8")
    .split("\n")
    .find((l) => l.startsWith("DATABASE_URL="));
  if (linea) process.env.DATABASE_URL = linea.slice("DATABASE_URL=".length).replace(/^"|"$/g, "");
}

const url = process.env.DATABASE_URL ?? "";
const postgres = /^postgres(ql)?:\/\//.test(url);
const proveedor = postgres ? "postgresql" : "sqlite";
const datasource = postgres
  ? `datasource db {\n  provider  = "postgresql"\n  url       = env("DATABASE_URL")\n  directUrl = env("DATABASE_URL_UNPOOLED")\n}`
  : `datasource db {\n  provider = "sqlite"\n  url      = env("DATABASE_URL")\n}`;

if (postgres && !process.env.DATABASE_URL_UNPOOLED) {
  console.error("Falta DATABASE_URL_UNPOOLED (cadena directa de Neon, sin \"-pooler\").");
  process.exit(1);
}

const ruta = "prisma/schema.prisma";
const esquema = readFileSync(ruta, "utf8");
const nuevo = esquema.replace(/datasource db \{[^}]*\}/, datasource);
if (nuevo !== esquema) writeFileSync(ruta, nuevo);
console.log(`Prisma: proveedor ${proveedor}`);
