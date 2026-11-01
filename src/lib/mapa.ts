// Mapa mundial del catálogo (D47): contornos de world-atlas (1:110 millones) y
// proyección Equal Earth de d3-geo. Se dibuja en el servidor: el celular recibe SVG.
import "server-only";
import { geoEqualEarth, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";
import mundo from "world-atlas/countries-110m.json";

export const ANCHO = 960;
export const ALTO = 470;

export type Continente = "América del Norte" | "América del Sur" | "Europa" | "Asia" | "Oceanía";

/**
 * Países del catálogo: código ISO 3166 numérico (el que usa world-atlas), continente
 * y dónde va la burbuja con el número ([longitud, latitud]). En Europa la burbuja se
 * desplaza (al mar, si hace falta) para que no se encimen; `ancla` es el punto del país al que apunta.
 */
export const PAISES_MAPA: Record<string, { iso: string; continente: Continente; burbuja: [number, number]; ancla?: [number, number] }> = {
  "Canadá": { iso: "124", continente: "América del Norte", burbuja: [-100, 58] },
  "Estados Unidos": { iso: "840", continente: "América del Norte", burbuja: [-98, 39] },
  "México": { iso: "484", continente: "América del Norte", burbuja: [-102, 23] },
  "Brasil": { iso: "076", continente: "América del Sur", burbuja: [-52, -10] },
  "Chile": { iso: "152", continente: "América del Sur", burbuja: [-86, -36], ancla: [-71, -33] },
  "Argentina": { iso: "032", continente: "América del Sur", burbuja: [-62, -38] },
  "Reino Unido": { iso: "826", continente: "Europa", burbuja: [-24, 60], ancla: [-2, 53] },
  "Países Bajos": { iso: "528", continente: "Europa", burbuja: [4, 66], ancla: [5.5, 52.3] },
  "Alemania": { iso: "276", continente: "Europa", burbuja: [24, 63], ancla: [10, 51] },
  "Francia": { iso: "250", continente: "Europa", burbuja: [-24, 47], ancla: [2.5, 46.5] },
  "España": { iso: "724", continente: "Europa", burbuja: [-24, 35], ancla: [-3.7, 40] },
  "Corea del Sur": { iso: "410", continente: "Asia", burbuja: [118, 42], ancla: [127.8, 36.5] },
  "Japón": { iso: "392", continente: "Asia", burbuja: [150, 40], ancla: [139, 36] },
  "Australia": { iso: "036", continente: "Oceanía", burbuja: [134, -25] },
};

const ANTARTIDA = "010";
export const PERU = "604";

type Trazo = { id: string; d: string };
let cache: { paises: Trazo[]; punto: (lonLat: [number, number]) => [number, number] } | null = null;

/** Contornos de todos los países (sin la Antártida) y la función que proyecta un punto. */
export function trazarMapa() {
  if (cache) return cache;
  const topo = mundo as unknown as Topology<{ countries: GeometryCollection }>;
  const geo = feature(topo, topo.objects.countries);
  const visibles = { ...geo, features: geo.features.filter((f) => String(f.id) !== ANTARTIDA) };
  const proyeccion = geoEqualEarth().fitSize([ANCHO, ALTO], visibles);
  const camino = geoPath(proyeccion);
  cache = {
    paises: visibles.features.map((f) => ({ id: String(f.id), d: camino(f) ?? "" })),
    punto: (lonLat) => (proyeccion(lonLat) ?? [0, 0]) as [number, number],
  };
  return cache;
}
