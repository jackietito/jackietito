import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { exigirRol } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { DIMENSIONES_ENCUESTA } from "@/lib/catalogos";
import { formatearFecha } from "@/lib/fechas";
import { promedios, proporcion, satisfecho } from "@/lib/indicadores";

export const metadata: Metadata = { title: "Reporte por entidad" };

const NOMBRE_DIMENSION: Record<keyof typeof DIMENSIONES_ENCUESTA, string> = {
  claridad: "Claridad", suficiencia: "Suficiencia", oportunidadInfo: "Oportunidad", utilidad: "Utilidad",
};
const DIMS = Object.keys(NOMBRE_DIMENSION) as (keyof typeof NOMBRE_DIMENSION)[];
const celda = "border-t border-borde p-2";
const nota = (n: number | null) => (n === null ? "—" : n.toLocaleString("es-PE", { minimumFractionDigits: 1 }));

/**
 * Retroalimentación a entidades (RF18): resultados de la encuesta y comentarios
 * sobre las fichas de una entidad. El administrador elige la entidad; el gestor
 * ve solo la suya. No se muestra quién respondió (D31).
 */
export default async function Reporte({ searchParams }: { searchParams: Promise<{ entidad?: string }> }) {
  const { entidad: sigla } = await searchParams;
  const u = await exigirRol(["admin", "gestor"], "/reporte");
  const entidades = await prisma.entidad.findMany({ orderBy: { nombre: "asc" } });
  const entidad = u.rol === "gestor" ? entidades.find((e) => e.id === u.entidadId) : entidades.find((e) => e.sigla === sigla) ?? entidades[0];
  if (!entidad) redirect("/");

  const encuestas = await prisma.encuesta.findMany({
    where: { oportunidad: { entidadId: entidad.id } },
    include: { oportunidad: { select: { id: true, nombre: true } } },
    orderBy: { creadaEn: "desc" },
  });
  const prom = promedios(encuestas);
  const sat = proporcion(encuestas.filter(satisfecho).length, encuestas.length);
  const porFicha = [...new Map(encuestas.map((e) => [e.oportunidad!.id, e.oportunidad!.nombre])).entries()].map(([id, nombre]) => {
    const lista = encuestas.filter((e) => e.oportunidad!.id === id);
    return { id, nombre, n: lista.length, prom: promedios(lista) };
  });
  const comentarios = encuestas.filter((e) => e.comentario.trim());

  return (
    <div className="space-y-8">
      <div>
        <nav aria-label="Ruta de navegación" className="mb-2 text-sm">
          <Link href={u.rol === "admin" ? "/admin" : "/gestion"} className="enlace">← Volver al {u.rol === "admin" ? "tablero" : "panel de gestión"}</Link>
        </nav>
        <h1 className="titulo-pagina">Reporte para {entidad.nombre} ({entidad.sigla})</h1>
        <p className="mt-2 max-w-3xl text-suave">
          Resultados de la encuesta de satisfacción sobre las fichas de esta entidad, para mejorar su información. Escala de 1 a 5.
          Las respuestas son anónimas.
        </p>
      </div>

      {u.rol === "admin" && (
        <form method="get" action="/reporte" className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div>
            <label htmlFor="entidad" className="etiqueta-campo">Entidad</label>
            <select id="entidad" name="entidad" defaultValue={entidad.sigla} className="campo">
              {entidades.map((e) => <option key={e.id} value={e.sigla}>{e.nombre} ({e.sigla})</option>)}
            </select>
          </div>
          <button type="submit" className="btn-primario">Ver reporte</button>
        </form>
      )}

      {encuestas.length === 0 ? (
        <p className="tarjeta">Todavía no hay respuestas de la encuesta sobre las fichas de esta entidad.</p>
      ) : (
        <>
          <section aria-labelledby="titulo-resumen" className="space-y-3">
            <h2 id="titulo-resumen" className="titulo-seccion">Resumen ({encuestas.length} {encuestas.length === 1 ? "respuesta" : "respuestas"})</h2>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {DIMS.map((d) => (
                <li key={d} className="tarjeta">
                  <p className="text-sm font-semibold">{NOMBRE_DIMENSION[d]}</p>
                  <p className="text-3xl font-bold text-marca-oscura">{nota(prom[d])}<span className="text-base font-normal text-suave"> / 5</span></p>
                </li>
              ))}
              <li className="tarjeta">
                <p className="text-sm font-semibold">Clara, oportuna y útil</p>
                <p className="text-3xl font-bold text-marca-oscura">{sat.pct}%</p>
                <p className="text-xs text-suave">{sat.valor} de {sat.total} respuestas</p>
              </li>
            </ul>
          </section>

          <section aria-labelledby="titulo-fichas" className="space-y-2">
            <h2 id="titulo-fichas" className="titulo-seccion">Por ficha</h2>
            <div role="region" aria-label="Tabla por ficha (se desplaza en horizontal)" tabIndex={0} className="overflow-x-auto rounded-xl border border-borde bg-white">
              <table className="w-full min-w-[36rem] text-sm">
                <caption className="sr-only">Promedio de cada dimensión por ficha</caption>
                <thead className="bg-marca-clara text-left">
                  <tr>
                    <th scope="col" className="p-2">Ficha</th>
                    <th scope="col" className="p-2 text-right">Respuestas</th>
                    {DIMS.map((d) => <th key={d} scope="col" className="p-2 text-right">{NOMBRE_DIMENSION[d]}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {porFicha.map((f) => (
                    <tr key={f.id}>
                      <th scope="row" className={`${celda} text-left font-semibold`}>{f.nombre}</th>
                      <td className={`${celda} text-right`}>{f.n}</td>
                      {DIMS.map((d) => <td key={d} className={`${celda} text-right`}>{nota(f.prom[d])}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section aria-labelledby="titulo-comentarios" className="space-y-2">
            <h2 id="titulo-comentarios" className="titulo-seccion">Comentarios ({comentarios.length})</h2>
            {comentarios.length ? (
              <ul className="space-y-2">
                {comentarios.map((c) => (
                  <li key={c.id} className="tarjeta">
                    <p>«{c.comentario}»</p>
                    <p className="mt-1 text-xs text-suave">Sobre: {c.oportunidad!.nombre} · {formatearFecha(c.creadaEn)}</p>
                  </li>
                ))}
              </ul>
            ) : <p className="text-suave">No hay comentarios escritos.</p>}
          </section>
        </>
      )}
    </div>
  );
}
