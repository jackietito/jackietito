// Recomendaciones por perfil (RF05): cuenta los criterios del perfil (RF03)
// que coinciden con cada ficha y devuelve los criterios coincidentes.
import type { Oportunidad, Perfil } from "@prisma/client";
import { costoTotalUsd, estadoConvocatoria } from "./oportunidades";

/** Criterios que se comparan entre el perfil y la ficha. */
export const CRITERIOS = [
  "area", "nivel", "pais", "modalidad", "idioma", "costo", "financiamiento",
] as const;
export type Criterio = (typeof CRITERIOS)[number];

/** Mínimo de criterios coincidentes para recomendar una ficha (decisión D17). */
export const MINIMO_COINCIDENCIAS = 4;

/** Los campos del perfil con varias opciones se guardan separados por "|". */
const lista = (s: string) => s.split("|").filter(Boolean);

export function paisesDePerfil(p: Pick<Perfil, "paises">): string[] {
  return lista(p.paises);
}

export function modalidadesDePerfil(p: Pick<Perfil, "modalidad">): string[] {
  return lista(p.modalidad);
}

export function idiomasDePerfil(p: Pick<Perfil, "idioma">): string[] {
  return lista(p.idioma);
}

/** Idiomas que la persona acredita con certificado (D57). Sin perfil, ninguno. */
export function idiomasAcreditados(p: Pick<Perfil, "idiomasAcreditados"> | null | undefined): string[] {
  return p ? lista(p.idiomasAcreditados) : [];
}

/** Texto en lenguaje claro de cada criterio coincidente. */
export function textoCriterio(c: Criterio, o: Oportunidad): string {
  switch (c) {
    case "area": return `Área: ${o.area}`;
    case "nivel": return "Nivel que buscas";
    case "pais": return `País de interés: ${o.pais}`;
    case "modalidad": return "Modalidad que te interesa";
    case "idioma": return `Idioma: ${o.idioma}`;
    case "costo": return "Dentro de tu presupuesto";
    case "financiamiento": return o.financiamientoTipo === "ninguno" ? "Sin beca, como buscas" : "Ofrece financiamiento";
  }
}

type Busqueda = Pick<Perfil, "necesitaFinanciamiento" | "buscaSinBeca">;

/**
 * El criterio de financiamiento cuenta solo si la persona eligió una sola opción:
 * «con beca o crédito» o «sin beca». Si busca ambas, no discrimina (D44).
 */
function financiamientoAplica(p: Busqueda): boolean {
  return p.necesitaFinanciamiento !== p.buscaSinBeca;
}

export function totalCriterios(p: Busqueda): number {
  return financiamientoAplica(p) ? CRITERIOS.length : CRITERIOS.length - 1;
}

export function criteriosCoincidentes(p: Perfil, o: Oportunidad): Criterio[] {
  const res: Criterio[] = [];
  if (p.area === o.area) res.push("area");
  if (p.nivel === o.nivel) res.push("nivel");
  if (paisesDePerfil(p).includes(o.pais)) res.push("pais");
  if (modalidadesDePerfil(p).includes(o.modalidad)) res.push("modalidad");
  if (idiomasDePerfil(p).includes(o.idioma)) res.push("idioma");
  if (p.costoMaxUsd <= 0 || costoTotalUsd(o) <= p.costoMaxUsd) res.push("costo");
  if (financiamientoAplica(p)) {
    const ofrece = o.financiamientoTipo !== "ninguno";
    if (p.necesitaFinanciamiento ? ofrece : !ofrece) res.push("financiamiento");
  }
  return res;
}

export type Recomendacion<T extends Oportunidad> = { oportunidad: T; criterios: Criterio[] };

/**
 * Fichas no cerradas con al menos MINIMO_COINCIDENCIAS criterios, ordenadas por
 * número de coincidencias y luego por fecha de cierre.
 */
export function recomendar<T extends Oportunidad>(p: Perfil, lista: T[], hoy: Date): Recomendacion<T>[] {
  return lista
    .filter((o) => estadoConvocatoria(o, hoy) !== "cerrada")
    .map((o) => ({ oportunidad: o, criterios: criteriosCoincidentes(p, o) }))
    .filter((r) => r.criterios.length >= MINIMO_COINCIDENCIAS)
    .sort((a, b) =>
      b.criterios.length - a.criterios.length ||
      a.oportunidad.fechaCierre.getTime() - b.oportunidad.fechaCierre.getTime(),
    );
}
