// Ruta paso a paso (RF09) y checklist personalizado (RF11).
import type { PrismaClient, Tramite } from "@prisma/client";
import { diasEntre, formatearFecha, sumarDias, textoDias } from "./fechas";
import { enlacesTramite, textoCosto, textoPlazo, type EnlaceTramite } from "./tramites";

/** Días antes del cierre recomendados para enviar la postulación en el canal oficial. */
export const DIAS_MARGEN_POSTULACION = 7;

export type PasoRuta = {
  orden: number;
  tipo: "tramite" | "postulacion";
  titulo: string;
  entidad: string;
  descripcion: string;
  documentos: string[];
  /** Fecha recomendada para iniciar el paso, calculada hacia atrás desde el cierre */
  fechaRecomendada: Date;
  /** Plazo y costo referenciales, ya en palabras (null en el paso de postulación) */
  plazo: string | null;
  /** Días que toma el trámite (0 en la postulación) */
  plazoDias: number;
  costo: string | null;
  enlace: string;
  /** Enlaces oficiales del trámite; si hay, reemplazan al enlace de ejemplo */
  enlaces: EnlaceTramite[];
  tramiteId: string | null;
};

/**
 * Construye la ruta: los trámites asociados ordenados según el mapa de trámites,
 * cada uno con su fecha recomendada (cierre − anticipación), y al final la
 * postulación en el canal oficial. Si una fecha recomendada ya pasó, el paso se
 * muestra como urgente en la interfaz.
 */
export function construirRuta(
  oportunidad: { fechaCierre: Date; enlaceOficial: string; institucion: string; nombre: string },
  tramites: Tramite[],
): PasoRuta[] {
  const pasos: PasoRuta[] = [...tramites]
    .sort((a, b) => a.orden - b.orden)
    .map((t, i) => ({
      orden: i + 1,
      tipo: "tramite",
      titulo: t.nombre,
      entidad: t.entidadResponsable,
      descripcion: t.descripcion,
      documentos: t.documentos.split("\n").map((d) => d.trim()).filter(Boolean),
      fechaRecomendada: sumarDias(oportunidad.fechaCierre, -t.anticipacionDias),
      plazo: textoPlazo(t),
      plazoDias: t.plazoDias,
      costo: textoCosto(t),
      enlace: t.enlaceOficial,
      enlaces: enlacesTramite(t),
      tramiteId: t.id,
    }));
  pasos.push({
    orden: pasos.length + 1,
    tipo: "postulacion",
    titulo: "Postular en el canal oficial",
    entidad: oportunidad.institucion,
    descripcion:
      "Con tus documentos listos, completa la postulación en el sitio oficial de la convocatoria. Talento sin Fronteras no recibe postulaciones.",
    documentos: ["Todos los documentos de tu checklist"],
    fechaRecomendada: sumarDias(oportunidad.fechaCierre, -DIAS_MARGEN_POSTULACION),
    plazo: null,
    plazoDias: 0,
    costo: null,
    enlace: oportunidad.enlaceOficial,
    enlaces: [],
    tramiteId: null,
  });
  return pasos;
}

type Cliente = Pick<
  PrismaClient,
  "guardada" | "itemChecklist" | "avanceTramite" | "oportunidad"
>;

/**
 * Genera (o regenera sin perder avances) la ruta y el checklist de un usuario
 * para una oportunidad. Si la oportunidad no estaba guardada, la guarda.
 */
export async function generarRuta(db: Cliente, usuarioId: string, oportunidadId: string, hoy: Date) {
  const op = await db.oportunidad.findUniqueOrThrow({
    where: { id: oportunidadId },
    include: { requisitos: { orderBy: { orden: "asc" } }, tramites: true },
  });

  await db.guardada.upsert({
    where: { usuarioId_oportunidadId: { usuarioId, oportunidadId } },
    create: { usuarioId, oportunidadId, creadaEn: hoy, rutaGeneradaEn: hoy },
    update: { rutaGeneradaEn: hoy },
  });

  const existentes = await db.itemChecklist.findMany({ where: { usuarioId, oportunidadId } });
  const yaTiene = new Set(existentes.map((i) => i.requisitoId));
  const nuevos = op.requisitos.filter((r) => !yaTiene.has(r.id));
  if (nuevos.length) {
    await db.itemChecklist.createMany({
      data: nuevos.map((r) => ({
        usuarioId,
        oportunidadId,
        requisitoId: r.id,
        descripcion: r.descripcion,
        categoria: r.categoria,
      })),
    });
  }

  const avances = await db.avanceTramite.findMany({ where: { usuarioId, oportunidadId } });
  const conAvance = new Set(avances.map((a) => a.tramiteId));
  const faltan = op.tramites.filter((t) => !conAvance.has(t.tramiteId));
  if (faltan.length) {
    await db.avanceTramite.createMany({
      data: faltan.map((t) => ({ usuarioId, oportunidadId, tramiteId: t.tramiteId })),
    });
  }
}

export function porcentaje(hechos: number, total: number): number {
  return total === 0 ? 0 : Math.round((hechos / total) * 100);
}

/** Días antes de la fecha recomendada en que un paso se marca como «pronto». */
export const DIAS_PROXIMO = 14;

export type AvisoPaso = {
  nivel: "hecho" | "normal" | "pronto" | "inicia-hoy" | "no-alcanza";
  texto: string;
};

/**
 * Qué decirle a la persona sobre un paso (D63). Si la fecha recomendada ya pasó, no
 * se habla de «atraso»: se dice hasta cuándo aún llega si empieza hoy, o que ese
 * paso ya no alcanza antes del cierre.
 */
export function avisoPaso(p: Pick<PasoRuta, "tipo" | "fechaRecomendada" | "plazoDias">, cierre: Date, hoy: Date, completado = false): AvisoPaso {
  if (completado) return { nivel: "hecho", texto: "Completado" };
  const dias = diasEntre(hoy, p.fechaRecomendada);
  if (dias >= 0) return { nivel: dias <= DIAS_PROXIMO ? "pronto" : "normal", texto: `Empieza ${textoDias(dias)}.` };
  const limite = p.tipo === "postulacion" ? cierre : sumarDias(cierre, -DIAS_MARGEN_POSTULACION);
  const termina = sumarDias(hoy, p.plazoDias);
  if (termina <= cierre) {
    const fecha = termina <= limite ? limite : cierre;
    return { nivel: "inicia-hoy", texto: `Inicia hoy: aún llegas si lo completas antes del ${formatearFecha(fecha)}.` };
  }
  return { nivel: "no-alcanza", texto: "Este paso ya no alcanza a completarse antes del cierre." };
}

export const NO_ALCANZABLE = "Esta convocatoria ya no es alcanzable: mira estas alternativas";
