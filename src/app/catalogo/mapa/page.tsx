import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { obtenerHoy } from "@/lib/hoy";
import { estadoConvocatoria } from "@/lib/oportunidades";
import { ALTO, ANCHO, PAISES_MAPA, PERU, trazarMapa, type Continente } from "@/lib/mapa";

export const metadata: Metadata = { title: "Mapa de oportunidades" };

const CONTINENTES: Continente[] = ["América del Norte", "América del Sur", "Europa", "Asia", "Oceanía"];

/** Tono del país según cuántas oportunidades tiene (escala secuencial de la marca). */
function tono(n: number): string {
  if (n >= 5) return "#0b5563";
  if (n >= 3) return "#4f9aa5";
  return "#a8d3d9";
}

const urlPaises = (paises: string[]) => `/catalogo?${paises.map((p) => `pais=${encodeURIComponent(p)}`).join("&")}`;

/** Catálogo en un mapa mundial (D47): totales por continente y país; cada país lleva al catálogo filtrado. */
export default async function Mapa({ searchParams }: { searchParams: Promise<{ estado?: string }> }) {
  const { estado } = await searchParams;
  const soloAbiertas = estado === "abierta";
  const [hoy, ops] = await Promise.all([obtenerHoy(), prisma.oportunidad.findMany({ where: { publicada: true } })]);
  const visibles = soloAbiertas ? ops.filter((o) => estadoConvocatoria(o, hoy) === "abierta") : ops;

  const porPais = new Map<string, number>();
  for (const o of visibles) porPais.set(o.pais, (porPais.get(o.pais) ?? 0) + 1);
  const paises = [...porPais.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "es"));
  const isoAPais = new Map(Object.entries(PAISES_MAPA).map(([nombre, d]) => [d.iso, nombre]));
  const continenteDe = (p: string): Continente | "Otros" => PAISES_MAPA[p]?.continente ?? "Otros";
  const porContinente = [...CONTINENTES, "Otros" as const]
    .map((c) => {
      const lista = paises.filter(([p]) => continenteDe(p) === c);
      return { c, paises: lista.map(([p]) => p), total: lista.reduce((s, [, n]) => s + n, 0) };
    })
    .filter((x) => x.total > 0);
  const { paises: trazos, punto } = trazarMapa();
  const peru = punto([-90, -15]);
  const sufijo = (n: number) => (n === 1 ? "oportunidad" : "oportunidades");
  const enlacePais = (p: string) => (soloAbiertas ? `${urlPaises([p])}&estado=abierta` : urlPaises([p]));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="titulo-pagina">Mapa de oportunidades</h1>
          <p className="mt-2 max-w-3xl text-suave">
            {visibles.length} {sufijo(visibles.length)} {soloAbiertas ? "con convocatoria abierta " : ""}en {paises.length} países.
            Toca un país para ver sus oportunidades en el catálogo.
          </p>
        </div>
        <nav aria-label="Vista del catálogo" className="flex gap-2">
          <Link href="/catalogo" className="btn-secundario text-sm">Ver como lista</Link>
          <Link href={soloAbiertas ? "/catalogo/mapa" : "/catalogo/mapa?estado=abierta"} className="btn-secundario text-sm">
            {soloAbiertas ? "Ver todas las convocatorias" : "Solo convocatorias abiertas"}
          </Link>
        </nav>
      </div>

      <section aria-labelledby="titulo-mapa" className="space-y-2">
        <h2 id="titulo-mapa" className="titulo-seccion">Mapa mundial</h2>
        <div className="overflow-hidden rounded-xl border border-borde bg-[#eef6f7]">
          <svg viewBox={`0 0 ${ANCHO} ${ALTO}`} role="group" aria-labelledby="titulo-mapa" className="block h-auto w-full">
            {trazos.map((t) => {
              const pais = isoAPais.get(t.id);
              const n = pais ? porPais.get(pais) ?? 0 : 0;
              if (!pais || n === 0) {
                return (
                  <path key={t.id} d={t.d} aria-hidden="true" fill={t.id === PERU ? "#f5c451" : "#dfe5e6"} stroke="#ffffff" strokeWidth={0.5} />
                );
              }
              return (
                <a key={t.id} href={enlacePais(pais)} aria-label={`${pais}: ${n} ${sufijo(n)}`} className="mapa-pais">
                  <title>{`${pais}: ${n} ${sufijo(n)}`}</title>
                  <path d={t.d} fill={tono(n)} stroke="#ffffff" strokeWidth={0.6} />
                </a>
              );
            })}
            {paises.filter(([p]) => PAISES_MAPA[p]).map(([p, n]) => {
              const { burbuja, ancla } = PAISES_MAPA[p];
              const [x, y] = punto(burbuja);
              const [ax, ay] = ancla ? punto(ancla) : [x, y];
              return (
                <a key={p} href={enlacePais(p)} aria-hidden="true" tabIndex={-1} className="mapa-pais">
                  {ancla && <line x1={ax} y1={ay} x2={x} y2={y} stroke="#073b45" strokeWidth={1} pointerEvents="none" />}
                  {ancla && <circle cx={ax} cy={ay} r={2.5} fill="#073b45" pointerEvents="none" />}
                  <circle cx={x} cy={y} r={13} fill="#ffffff" stroke="#073b45" strokeWidth={2} />
                  <text x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize={13} fontWeight={700} fill="#073b45">{n}</text>
                </a>
              );
            })}
            <g aria-hidden="true">
              <text x={peru[0]} y={peru[1]} pointerEvents="none" fontSize={11} fill="#5c4400" fontWeight={700}>Perú</text>
            </g>
          </svg>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-suave" aria-hidden="true">
          <span className="flex items-center gap-1"><span className="inline-block h-3 w-5 rounded-sm" style={{ background: tono(1) }} /> 1 o 2</span>
          <span className="flex items-center gap-1"><span className="inline-block h-3 w-5 rounded-sm" style={{ background: tono(3) }} /> 3 o 4</span>
          <span className="flex items-center gap-1"><span className="inline-block h-3 w-5 rounded-sm" style={{ background: tono(5) }} /> 5 o más</span>
          <span className="flex items-center gap-1"><span className="inline-block h-3 w-5 rounded-sm bg-[#f5c451]" /> Perú, tu punto de partida</span>
        </div>
      </section>

      <section aria-labelledby="titulo-continentes">
        <h2 id="titulo-continentes" className="titulo-seccion mb-3">Por continente</h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {porContinente.map(({ c, paises: lista, total }) => (
            <li key={c}>
              <Link href={soloAbiertas ? `${urlPaises(lista)}&estado=abierta` : urlPaises(lista)}
                className="tarjeta flex h-full flex-col gap-0.5 p-3 no-underline hover:border-marca sm:p-4">
                <span className="text-2xl font-bold text-marca-oscura sm:text-3xl">{total}</span>
                <span className="font-semibold text-texto">{c}</span>
                <span className="text-xs text-suave">{lista.join(", ")}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="titulo-paises" className="space-y-2">
        <h2 id="titulo-paises" className="titulo-seccion">Por país</h2>
        <div role="region" aria-label="Tabla de oportunidades por país (se desplaza en horizontal)" tabIndex={0} className="overflow-x-auto rounded-xl border border-borde bg-white">
          <table className="w-full min-w-[22rem] text-sm">
            <caption className="sr-only">Oportunidades por país y continente</caption>
            <thead className="bg-marca-clara text-left">
              <tr>
                <th scope="col" className="p-2">País</th>
                <th scope="col" className="p-2">Continente</th>
                <th scope="col" className="p-2 text-right">Oportunidades</th>
              </tr>
            </thead>
            <tbody>
              {paises.map(([p, n]) => (
                <tr key={p}>
                  <th scope="row" className="border-t border-borde p-2 text-left font-semibold">
                    <Link href={enlacePais(p)} className="enlace">{p}</Link>
                  </th>
                  <td className="border-t border-borde p-2">{continenteDe(p)}</td>
                  <td className="border-t border-borde p-2 text-right tabular-nums">{n}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
