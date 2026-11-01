// Semáforo «¿Llego a tiempo?» (D61). Compara los días que faltan para el cierre con
// el tiempo que toman los trámites que pide la oportunidad, por la ruta crítica:
// lo que puede hacerse a la vez no se suma.
//   - El examen de idioma corre en paralelo con todo lo demás.
//   - Documentos de la universidad (diploma, certificado): en paralelo entre sí.
//   - Certificación (verificación de firma → apostilla → traducción): en cadena,
//     después de tener los documentos.
//   - Antecedentes y trámites sin tipo: en paralelo.
import type { Oportunidad, Tramite } from "@prisma/client";
import { diasEntre } from "./fechas";
import { estadoConvocatoria } from "./oportunidades";

export type Llegada = {
  nivel: "verde" | "ambar" | "rojo";
  titulo: string;
  detalle: string;
  /** Días que toman los trámites pendientes por la ruta crítica */
  diasTramites: number;
  /** Días que faltan para el cierre */
  diasCierre: number;
};

/** Holgura mínima (días) para considerar que se llega con holgura. */
export const HOLGURA_VERDE = 8;

type T = Pick<Tramite, "id" | "plazoDias" | "tipo">;

export function diasRutaCritica(tramites: T[]): number {
  const max = (l: number[]) => (l.length ? Math.max(...l) : 0);
  const de = (tipo: string) => tramites.filter((t) => t.tipo === tipo).map((t) => t.plazoDias);
  const documentos = max(de("documento"));
  const certificacion = de("certificacion").reduce((s, n) => s + n, 0);
  const otros = tramites.filter((t) => !["idioma", "documento", "certificacion"].includes(t.tipo)).map((t) => t.plazoDias);
  return max([...de("idioma"), documentos + certificacion, ...otros]);
}

/**
 * Semáforo para una oportunidad abierta o próxima (null si ya cerró). `completados`
 * son los trámites que la persona ya terminó; no cuentan.
 */
export function llegoATiempo(
  o: Pick<Oportunidad, "fechaApertura" | "fechaCierre">,
  tramites: T[],
  hoy: Date,
  completados: Set<string> = new Set(),
): Llegada | null {
  if (estadoConvocatoria(o, hoy) === "cerrada") return null;
  const pendientes = tramites.filter((t) => !completados.has(t.id));
  const diasTramites = diasRutaCritica(pendientes);
  const diasCierre = diasEntre(hoy, o.fechaCierre);
  const holgura = diasCierre - diasTramites;
  const resumen = `Tus trámites toman unos ${diasTramites} días (haciendo a la vez los que se pueden) y faltan ${diasCierre} días para el cierre.`;
  if (holgura >= HOLGURA_VERDE) return { nivel: "verde", titulo: "Llegas con holgura", detalle: resumen, diasTramites, diasCierre };
  if (holgura >= 0) return { nivel: "ambar", titulo: "Llegas si empiezas esta semana", detalle: resumen, diasTramites, diasCierre };
  return { nivel: "rojo", titulo: "Los trámites toman más tiempo del que queda", detalle: resumen, diasTramites, diasCierre };
}

/** Oportunidades similares (misma área y nivel; si no hay, misma área) que cierran después y siguen vigentes. */
export function similaresQueCierranDespues<O extends Oportunidad>(o: Oportunidad, todas: O[], hoy: Date, cuantas = 2): O[] {
  const vigentes = todas.filter((x) => x.id !== o.id && x.publicada && estadoConvocatoria(x, hoy) !== "cerrada" && x.fechaCierre > o.fechaCierre);
  const porCierre = (a: O, b: O) => a.fechaCierre.getTime() - b.fechaCierre.getTime();
  const mismas = vigentes.filter((x) => x.area === o.area && x.nivel === o.nivel).sort(porCierre);
  const area = vigentes.filter((x) => x.area === o.area && !mismas.includes(x)).sort(porCierre);
  return [...mismas, ...area].slice(0, cuantas);
}
