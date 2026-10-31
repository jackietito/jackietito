// Alertas dentro de la plataforma (RF12). Se calculan al consultar el panel o
// la página de alertas (y al ingresar), según la fecha actual o simulada. La
// clave única (usuario + clave) evita duplicar una misma alerta (decisión D24).
import type { PrismaClient } from "@prisma/client";
import { UMBRALES_ALERTA } from "./catalogos";
import { diasEntre, formatearFecha, sumarDias, textoDias } from "./fechas";
import { estadoConvocatoria } from "./oportunidades";
import { recomendar } from "./recomendaciones";

/** Una oportunidad es «nueva» si se publicó en los últimos días indicados. */
export const DIAS_OPORTUNIDAD_NUEVA = 14;
/** Se avisa de un trámite cuando faltan estos días o menos para su fecha recomendada. */
export const DIAS_AVISO_TRAMITE = 7;

type NuevaAlerta = {
  tipo: "nueva" | "vencimiento" | "tramite";
  clave: string;
  titulo: string;
  mensaje: string;
  enlace: string;
  oportunidadId: string;
  /** El envío por correo se simula para los vencimientos */
  correo: boolean;
};

/** Crea las alertas que correspondan a la fecha `hoy` y devuelve cuántas se crearon. */
export async function sincronizarAlertas(db: PrismaClient, usuarioId: string, hoy: Date): Promise<number> {
  const u = await db.usuario.findUnique({
    where: { id: usuarioId },
    include: {
      perfil: true,
      guardadas: {
        where: { oportunidad: { publicada: true } },
        include: { oportunidad: { include: { tramites: { where: { tramite: { publicado: true } }, include: { tramite: true } } } } },
      },
      avances: true,
    },
  });
  if (!u || u.rol !== "ciudadano") return 0;
  const nuevas: NuevaAlerta[] = [];

  for (const g of u.guardadas) {
    const o = g.oportunidad;
    if (estadoConvocatoria(o, hoy) !== "abierta") continue;
    const dias = diasEntre(hoy, o.fechaCierre);
    // Solo el umbral más cercano alcanzado (7, 15 o 30 días), para no repetir avisos.
    const umbral = [...UMBRALES_ALERTA].sort((a, b) => a - b).find((n) => dias <= n);
    if (umbral !== undefined) {
      nuevas.push({
        tipo: "vencimiento",
        clave: `venc-${umbral}-${o.id}`,
        titulo: `Cierra ${textoDias(dias)}: ${o.nombre}`,
        mensaje: `La convocatoria que guardaste cierra el ${formatearFecha(o.fechaCierre)}. Revisa tu ruta y postula en el canal oficial antes del cierre.`,
        enlace: g.rutaGeneradaEn ? `/ruta/${o.id}` : `/oportunidades/${o.id}`,
        oportunidadId: o.id,
        correo: true,
      });
    }
    // Trámites de la ruta cuya fecha recomendada se acerca o ya pasó.
    if (g.rutaGeneradaEn) {
      for (const { tramite: t } of o.tramites) {
        const avance = u.avances.find((a) => a.oportunidadId === o.id && a.tramiteId === t.id);
        if (!avance || avance.estado === "completado") continue;
        const fecha = sumarDias(o.fechaCierre, -t.anticipacionDias);
        const faltan = diasEntre(hoy, fecha);
        if (faltan > DIAS_AVISO_TRAMITE) continue;
        nuevas.push({
          tipo: "tramite",
          clave: `tram-${o.id}-${t.id}`,
          titulo: faltan < 0 ? `Trámite atrasado: ${t.nombre}` : `Empieza ${textoDias(faltan)}: ${t.nombre}`,
          mensaje: `Para «${o.nombre}», conviene empezar este trámite a más tardar el ${formatearFecha(fecha)}. Ante: ${t.entidadResponsable}.`,
          enlace: `/ruta/${o.id}`,
          oportunidadId: o.id,
          correo: false,
        });
      }
    }
  }

  // Oportunidades nuevas que coinciden con el perfil.
  if (u.perfil) {
    const desde = sumarDias(hoy, -DIAS_OPORTUNIDAD_NUEVA);
    const recientes = await db.oportunidad.findMany({ where: { publicada: true, creadaEn: { gte: desde } } });
    for (const { oportunidad: o, criterios } of recomendar(u.perfil, recientes, hoy)) {
      nuevas.push({
        tipo: "nueva",
        clave: `nueva-${o.id}`,
        titulo: `Nueva oportunidad para ti: ${o.nombre}`,
        mensaje: `Se publicó hace poco y coincide con tu perfil en ${criterios.length} criterios.`,
        enlace: `/oportunidades/${o.id}`,
        oportunidadId: o.id,
        correo: false,
      });
    }
  }

  if (!nuevas.length) return 0;
  const existentes = new Set(
    (await db.alerta.findMany({ where: { usuarioId, clave: { in: nuevas.map((a) => a.clave) } }, select: { clave: true } }))
      .map((a) => a.clave),
  );
  const crear = nuevas.filter((a) => !existentes.has(a.clave));
  for (const a of crear) {
    await db.alerta.create({
      data: {
        usuarioId,
        tipo: a.tipo,
        clave: a.clave,
        titulo: a.titulo,
        mensaje: a.mensaje,
        enlace: a.enlace,
        creadaEn: hoy,
        oportunidadId: a.oportunidadId,
        correoSimulado: a.correo ? u.email : null,
      },
    });
  }
  return crear.length;
}
