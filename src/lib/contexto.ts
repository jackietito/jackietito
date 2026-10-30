// Datos del visitante que necesitan las tarjetas y fichas para sus acciones.
import "server-only";
import { usuarioActual } from "./auth";
import { leerComparador } from "./comparador";
import { prisma } from "./db";

export async function contextoAcciones() {
  const [usuario, comparar] = await Promise.all([usuarioActual(), leerComparador()]);
  const guardadas =
    usuario?.rol === "ciudadano"
      ? await prisma.guardada.findMany({ where: { usuarioId: usuario.id }, select: { oportunidadId: true } })
      : [];
  return {
    usuario,
    rol: usuario?.rol,
    guardadas: new Set(guardadas.map((g) => g.oportunidadId)),
    comparar: new Set(comparar),
  };
}
