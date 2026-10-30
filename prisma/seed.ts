// Carga los datos de prueba. Uso:
//   npm run db:seed              -> borra y vuelve a cargar todo
//   npm run db:seed -- --si-vacia -> solo carga si la base no tiene entidades (para despliegues)
import { PrismaClient } from "@prisma/client";
import { aFechaCalendario } from "../src/lib/fechas";
import { sembrar } from "../src/lib/seed/sembrar";

const prisma = new PrismaClient();

async function main() {
  if (process.argv.includes("--si-vacia") && (await prisma.entidad.count()) > 0) {
    console.log("La base ya tiene datos; no se carga el seed.");
    return;
  }
  const resumen = await sembrar(prisma, aFechaCalendario(new Date()));
  console.log("Datos de prueba cargados:", resumen);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
