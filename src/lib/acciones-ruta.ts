"use server";
// Acciones de la ruta: marcar ítems del checklist (RF11) y declarar el estado de
// cada trámite. La ruta se genera al abrir /ruta/[id] (D63).
import { revalidatePath } from "next/cache";
import { obtenerSesion } from "./auth";
import { ESTADOS_TRAMITE } from "./catalogos";
import { prisma } from "./db";

/** Marca o desmarca un ítem del checklist del usuario de la sesión. */
export async function marcarItem(itemId: string, completado: boolean) {
  const s = await obtenerSesion();
  if (!s || s.rol !== "ciudadano") return { ok: false };
  const item = await prisma.itemChecklist.findFirst({ where: { id: itemId, usuarioId: s.uid } });
  if (!item) return { ok: false };
  await prisma.itemChecklist.update({ where: { id: itemId }, data: { completado } });
  revalidatePath(`/ruta/${item.oportunidadId}`);
  return { ok: true };
}

/** Estado autodeclarado de un trámite de la ruta: pendiente, en curso o completado. */
export async function cambiarEstadoTramite(avanceId: string, estado: string) {
  const s = await obtenerSesion();
  if (!s || s.rol !== "ciudadano" || !(estado in ESTADOS_TRAMITE)) return { ok: false };
  const avance = await prisma.avanceTramite.findFirst({ where: { id: avanceId, usuarioId: s.uid } });
  if (!avance) return { ok: false };
  await prisma.avanceTramite.update({ where: { id: avanceId }, data: { estado } });
  revalidatePath(`/ruta/${avance.oportunidadId}`);
  return { ok: true };
}
