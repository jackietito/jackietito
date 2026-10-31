// Indicadores de la matriz de formulación (RF17) y reporte por entidad (RF18).
import type { Encuesta, Oportunidad, Requisito } from "@prisma/client";
import { DIMENSIONES_ENCUESTA } from "./catalogos";
import { estaDesactualizada, fichaCompleta } from "./oportunidades";

/** Nota mínima (de 1 a 5) para considerar que la persona califica la información como clara, oportuna o útil. */
export const NOTA_SATISFACCION = 4;

export type Proporcion = { valor: number; total: number; pct: number };

export function proporcion(valor: number, total: number): Proporcion {
  return { valor, total, pct: total ? Math.round((valor / total) * 100) : 0 };
}

type Ficha = Oportunidad & { requisitos: Requisito[] };

/** Indicadores 1 y 4: sobre las fichas publicadas. */
export function indicadoresFichas(fichas: Ficha[], hoy: Date) {
  const publicadas = fichas.filter((o) => o.publicada);
  return {
    completas: proporcion(publicadas.filter(fichaCompleta).length, publicadas.length),
    actualizadas: proporcion(publicadas.filter((o) => !estaDesactualizada(o, hoy)).length, publicadas.length),
  };
}

/** La persona califica la información como clara, oportuna y útil (D30). */
export function satisfecho(e: Pick<Encuesta, "claridad" | "oportunidadInfo" | "utilidad">): boolean {
  return e.claridad >= NOTA_SATISFACCION && e.oportunidadInfo >= NOTA_SATISFACCION && e.utilidad >= NOTA_SATISFACCION;
}

export type Ciudadano = {
  region: string;
  generoChecklist: boolean;
  /** Encuestas de la persona; se usa la más reciente */
  encuestas: Pick<Encuesta, "claridad" | "oportunidadInfo" | "utilidad" | "creadaEn">[];
};

function satisfechoPersona(c: Ciudadano): boolean | null {
  if (!c.encuestas.length) return null;
  const ultima = [...c.encuestas].sort((a, b) => b.creadaEn.getTime() - a.creadaEn.getTime())[0];
  return satisfecho(ultima);
}

/** Indicadores 2 y 3 (sobre personas), en total y por región del usuario. */
export function indicadoresUsuarios(ciudadanos: Ciudadano[]) {
  const calcular = (lista: Ciudadano[]) => {
    const conEncuesta = lista.map(satisfechoPersona).filter((s) => s !== null);
    return {
      registrados: lista.length,
      checklist: proporcion(lista.filter((c) => c.generoChecklist).length, lista.length),
      satisfechos: proporcion(conEncuesta.filter(Boolean).length, conEncuesta.length),
    };
  };
  const regiones = [...new Set(ciudadanos.map((c) => c.region))].sort((a, b) => a.localeCompare(b, "es"));
  return {
    total: calcular(ciudadanos),
    porRegion: regiones.map((r) => ({ region: r, ...calcular(ciudadanos.filter((c) => c.region === r)) })),
  };
}

/** Promedio de cada dimensión de la encuesta (RF18). */
export function promedios(encuestas: Pick<Encuesta, keyof typeof DIMENSIONES_ENCUESTA>[]) {
  const dims = Object.keys(DIMENSIONES_ENCUESTA) as (keyof typeof DIMENSIONES_ENCUESTA)[];
  return Object.fromEntries(
    dims.map((d) => [d, encuestas.length ? Math.round((encuestas.reduce((s, e) => s + e[d], 0) / encuestas.length) * 10) / 10 : null]),
  ) as Record<keyof typeof DIMENSIONES_ENCUESTA, number | null>;
}
