import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { obtenerHoy } from "@/lib/hoy";
import { aConsulta, filtrarOportunidades, leerFiltros } from "@/lib/oportunidades";
import { TarjetaOportunidad } from "@/components/oportunidad";
import { FiltrosAplicados, PanelFiltros } from "@/components/FiltrosCatalogo";
import { AccionesOportunidad } from "@/components/BotonesOportunidad";
import { contextoAcciones } from "@/lib/contexto";

export const metadata: Metadata = { title: "Catálogo de oportunidades" };

export default async function Catalogo({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filtros = leerFiltros(await searchParams);
  const hoy = await obtenerHoy();
  const [todas, ctx] = await Promise.all([
    prisma.oportunidad.findMany({ where: { publicada: true }, include: { entidad: true } }),
    contextoAcciones(),
  ]);
  const consulta = aConsulta(filtros).toString();
  const volver = consulta ? `/catalogo?${consulta}` : "/catalogo";
  const resultados = filtrarOportunidades(todas, filtros, hoy);
  const paises = [...new Set(todas.map((o) => o.pais))].sort((a, b) => a.localeCompare(b, "es"));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="titulo-pagina">Catálogo de oportunidades</h1>
        <p className="mt-2 max-w-3xl text-suave">
          Programas de posgrado y becas en el exterior publicados por {new Set(todas.map((o) => o.entidadId)).size} entidades.
          Cada ficha indica su fuente y la fecha de su última actualización.
        </p>
        <nav aria-label="Vista del catálogo" className="mt-3">
          <Link href={consulta ? `/catalogo/mapa?${consulta}` : "/catalogo/mapa"} className="btn-secundario text-sm">Ver en el mapa mundial</Link>
          <Link href="/orientacion#financiamiento" className="enlace ml-3 text-sm">¿Buscas financiamiento? Mira dónde buscar becas</Link>
        </nav>
      </div>

      <div className="grid gap-6 lg:grid-cols-[18rem_1fr]">
        <PanelFiltros filtros={filtros} paises={paises} base="/catalogo" />

        <section aria-labelledby="titulo-resultados" className="space-y-4">
          <h2 id="titulo-resultados" className="text-lg font-bold" role="status">
            {resultados.length === 1 ? "1 oportunidad encontrada" : `${resultados.length} oportunidades encontradas`}
          </h2>

          <FiltrosAplicados filtros={filtros} base="/catalogo" />

          {resultados.length ? (
            <ul className="grid gap-4 md:grid-cols-2">
              {resultados.map((o) => (
                <li key={o.id}>
                  <TarjetaOportunidad o={o} hoy={hoy}>
                    <AccionesOportunidad id={o.id} nombre={o.nombre} rol={ctx.rol} guardada={ctx.guardadas.has(o.id)}
                      enComparador={ctx.comparar.has(o.id)} volver={volver} />
                  </TarjetaOportunidad>
                </li>
              ))}
            </ul>
          ) : (
            <div className="tarjeta">
              <p className="font-semibold">No encontramos oportunidades con esos filtros.</p>
              <p className="mt-1 text-suave">Prueba quitando alguno de los filtros aplicados o <Link href="/catalogo" className="enlace">mira el catálogo completo</Link>.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
