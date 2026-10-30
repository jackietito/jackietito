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

export function paisesDePerfil(p: Pick<Perfil, "paises">): string[] {
  return p.paises.split("|").filter(Boolean);
}

/** Texto en lenguaje claro de cada criterio coincidente. */
export function textoCriterio(c: Criterio, o: Oportunidad): string {
  switch (c) {
    case "area": return `Área: ${o.area}`;
    case "nivel": return "Nivel que buscas";
    case "pais": return `País de interés: ${o.pais}`;
    case "modalidad": return "Modalidad que prefieres";
    case "idioma": return `Idioma: ${o.idioma}`;
    case "costo": return "Dentro de tu presupuesto";
    case "financiamiento": return "Ofrece financiamiento";
  }
}

/** Criterios que aplican al perfil: el de financiamiento solo si lo necesita. */
export function totalCriterios(p: Pick<Perfil, "necesitaFinanciamiento">): number {
  return p.necesitaFinanciamiento ? CRITERIOS.length : CRITERIOS.length - 1;
}

export function criteriosCoincidentes(p: Perfil, o: Oportunidad): Criterio[] {
  const res: Criterio[] = [];
  if (p.area === o.area) res.push("area");
  if (p.nivel === o.nivel) res.push("nivel");
  if (paisesDePerfil(p).includes(o.pais)) res.push("pais");
  if (p.modalidad === o.modalidad) res.push("modalidad");
  if (p.idioma === o.idioma) res.push("idioma");
  if (p.costoMaxUsd <= 0 || costoTotalUsd(o) <= p.costoMaxUsd) res.push("costo");
  // Si no necesita financiamiento, el criterio no se cuenta ni resta.
  if (p.necesitaFinanciamiento && o.financiamientoTipo !== "ninguno") res.push("financiamiento");
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
