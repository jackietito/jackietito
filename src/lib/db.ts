import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { attachDatabasePool } from "@vercel/functions";
import { Pool } from "pg";

// Cliente de Prisma según la base (decisión D15):
// - SQLite (local y pruebas E2E): motor por defecto de Prisma.
// - PostgreSQL (Neon): driver node-postgres (pg) con la cadena con pooling
//   (DATABASE_URL, host "-pooler"). En Vercel, attachDatabasePool cierra las
//   conexiones inactivas antes de que la función se suspenda (Fluid compute).
function crearCliente() {
  const url = process.env.DATABASE_URL ?? "";
  if (!/^postgres(ql)?:\/\//.test(url)) return new PrismaClient();
  const pool = new Pool({ connectionString: url, max: 5 });
  attachDatabasePool(pool);
  return new PrismaClient({ adapter: new PrismaPg(pool) });
}

// Reutiliza el cliente entre recargas en desarrollo.
const globalParaPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalParaPrisma.prisma ?? crearCliente();

if (process.env.NODE_ENV !== "production") globalParaPrisma.prisma = prisma;
