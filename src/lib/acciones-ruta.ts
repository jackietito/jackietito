"use server";
// Acciones del incremento 3: generar la ruta y el checklist (RF09, RF11),
// marcar ítems del checklist y declarar el estado de cada trámite.
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { obtenerSesion } from "./auth";
import { ESTADOS_TRAMITE } from "./catalogos";
import { prisma } from "./db";
import { obtenerHoy } from "./hoy";
import { estadoConvocatoria } from "./oportunidades";
import { generarRuta } from "./ruta";

async function ciudadano(volver: string) {
  const s = await obtenerSesion();
  if (!s || s.rol !== "ciudadano") redirect(`/ingresar?volver=${encodeURIComponent(volver)}`);
  return s.uid;
}

export async function generarMiRuta(fd: FormData) {
  const id = String(fd.get("oportunidadId") ?? "");
  const uid = await ciudadano(`/ruta/${id}`);
  const [o, hoy] = await Promise.all([prisma.oportunidad.findFirst({ where: { id, publicada: true } }), obtenerHoy()]);
  if (!o) redirect("/catalogo");
  // No se genera una ruta para una convocatoria cerrada (decisión D21).
  if (estadoConvocatoria(o, hoy) === "cerrada") redirect(`/ruta/${id}`);
  await generarRuta(prisma, uid, id, hoy);
  redirect(`/ruta/${id}?generada=1`);
}

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
