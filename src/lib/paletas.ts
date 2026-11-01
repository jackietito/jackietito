// Tonalidades de la plataforma que puede elegir el administrador (D49). Son
// paletas cerradas con contraste AA verificado (texto blanco sobre el color
// principal y color principal sobre su tono claro, ambos ≥ 5,8:1), para que el
// cambio de colores no rompa la accesibilidad.
import { prisma } from "./db";

export const CLAVE_PALETA = "paleta";

export const PALETAS = {
  turquesa: { nombre: "Turquesa (predeterminada)", marca: "#0b5563", oscura: "#073b45", clara: "#e6f2f4" },
  azul: { nombre: "Azul", marca: "#1d4ed8", oscura: "#172554", clara: "#e8eefc" },
  verde: { nombre: "Verde", marca: "#15603a", oscura: "#0c3b24", clara: "#e6f3ec" },
  morado: { nombre: "Morado", marca: "#5b2a86", oscura: "#36174f", clara: "#f1eaf8" },
} as const;

export type ClavePaleta = keyof typeof PALETAS;

export async function obtenerPaleta(): Promise<ClavePaleta> {
  const conf = await prisma.configuracion.findUnique({ where: { clave: CLAVE_PALETA } });
  return conf && conf.valor in PALETAS ? (conf.valor as ClavePaleta) : "turquesa";
}

/** Variables CSS de la paleta, para el elemento raíz (sobrescriben las de globals.css). */
export function variablesPaleta(clave: ClavePaleta): Record<string, string> {
  const p = PALETAS[clave];
  return { "--color-marca": p.marca, "--color-marca-oscura": p.oscura, "--color-marca-clara": p.clara };
}
