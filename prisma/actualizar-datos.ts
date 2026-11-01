// Actualizaciones de datos idempotentes para la base publicada (D56, D57).
// Corre en cada despliegue (`npm run vercel-build`) después de `prisma db push`:
// completa datos nuevos sin borrar nada, para no tener que restablecer los datos
// de prueba. Solo escribe donde el campo sigue vacío, así respeta lo que haya
// cambiado un gestor.
import { PrismaClient } from "@prisma/client";
import { ENLACES_TRAMITES } from "../src/lib/seed/datos";

const prisma = new PrismaClient(
  process.env.DATABASE_URL?.startsWith("postgres") && process.env.DATABASE_URL_UNPOOLED
    ? { datasourceUrl: process.env.DATABASE_URL_UNPOOLED }
    : undefined,
);

async function main() {
  const cambios = await Promise.all([
    prisma.tramite.updateMany({
      where: { nombre: "Obtener constancia de verificación de firma", enlaces: "" },
      data: { enlaces: ENLACES_TRAMITES.constancia },
    }),
    prisma.tramite.updateMany({
      where: { nombre: "Apostillar documentos académicos", enlaces: "" },
      data: { enlaces: ENLACES_TRAMITES.apostilla },
    }),
    prisma.tramite.updateMany({
      where: { nombre: "Rendir un examen internacional de idioma", tipo: "" },
      data: { tipo: "idioma" },
    }),
    // Tipos para la ruta crítica de «¿Llego a tiempo?» (D61)
    ...([
      ["Solicitar copia certificada del diploma de grado", "documento"],
      ["Solicitar certificado de estudios", "documento"],
      ["Obtener constancia de verificación de firma", "certificacion"],
      ["Apostillar documentos académicos", "certificacion"],
      ["Traducir oficialmente los documentos", "certificacion"],
      ["Obtener certificado de antecedentes penales", "antecedentes"],
      ["Obtener certificado de antecedentes policiales", "antecedentes"],
    ] as const).map(([nombre, tipo]) => prisma.tramite.updateMany({ where: { nombre, tipo: "" }, data: { tipo } })),
  ]);
  console.log("Actualización de datos:", cambios.map((c) => c.count));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
