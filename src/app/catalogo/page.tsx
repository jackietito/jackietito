import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { obtenerHoy } from "@/lib/hoy";
import {
  AREAS,
  ESTADOS,
  FINANCIAMIENTOS,
  IDIOMAS,
  MODALIDADES,
  NIVELES,
  etiqueta,
} from "@/lib/catalogos";
import { filtrarOportunidades, leerFiltros, type Filtros } from "@/lib/oportunidades";
import { formatearFechaCorta, desdeISO } from "@/lib/fechas";
import { TarjetaOportunidad } from "@/components/oportunidad";
import { PanelPlegable } from "@/components/PanelPlegable";
import { AccionesOportunidad } from "@/components/BotonesOportunidad";
import { contextoAcciones } from "@/lib/contexto";

export const metadata: Metadata = { title: "Catálogo de oportunidades" };

const COSTOS = [5000, 10000, 20000, 40000, 60000, 100000];

const NOMBRES_FILTRO: Partial<Record<keyof Filtros, string>> = {
  q: "Texto",
  pais: "País",
  area: "Área",
  nivel: "Nivel",
  modalidad: "Modalidad",
  idioma: "Idioma",
  financiamiento: "Financiamiento",
  estado: "Estado",
  costoMax: "Costo máximo",
  inicioDesde: "Inicio desde",
  inicioHasta: "Inicio hasta",
};

function valorLegible(clave: keyof Filtros, valor: string): string {
  switch (clave) {
    case "nivel": return etiqueta(NIVELES, valor);
    case "modalidad": return etiqueta(MODALIDADES, valor);
    case "financiamiento": return etiqueta(FINANCIAMIENTOS, valor);
    case "estado": return etiqueta(ESTADOS, valor);
    case "costoMax": return `${Number(valor).toLocaleString("es-PE")} USD`;
    case "inicioDesde":
    case "inicioHasta": {
      const f = desdeISO(valor);
      return f ? formatearFechaCorta(f) : valor;
    }
    default: return valor;
  }
}

function urlSin(f: Filtros, clave: keyof Filtros): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(f)) if (k !== clave && v) p.set(k, v);
  const s = p.toString();
  return s ? `/catalogo?${s}` : "/catalogo";
}

function Selector({
  id, etiquetaTexto, valor, opciones, todos,
}: {
  id: string; etiquetaTexto: string; valor?: string; opciones: [string, string][]; todos: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="etiqueta-campo">{etiquetaTexto}</label>
      <select id={id} name={id} defaultValue={valor ?? ""} className="campo">
        <option value="">{todos}</option>
        {opciones.map(([v, t]) => (
          <option key={v} value={v}>{t}</option>
        ))}
      </select>
    </div>
  );
}

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
  const consulta = new URLSearchParams(filtros as Record<string, string>).toString();
  const volver = consulta ? `/catalogo?${consulta}` : "/catalogo";
  const resultados = filtrarOportunidades(todas, filtros, hoy);
  const paises = [...new Set(todas.map((o) => o.pais))].sort((a, b) => a.localeCompare(b, "es"));
  const activos = (Object.keys(NOMBRES_FILTRO) as (keyof Filtros)[]).filter((k) => filtros[k]);
  const pares = <T extends Record<string, string>>(m: T) => Object.entries(m) as [string, string][];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="titulo-pagina">Catálogo de oportunidades</h1>
        <p className="mt-2 max-w-3xl text-suave">
          Programas de posgrado y becas en el exterior publicados por {new Set(todas.map((o) => o.entidadId)).size} entidades.
          Cada ficha indica su fuente y la fecha de su última actualización.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[18rem_1fr]">
        <aside aria-labelledby="titulo-filtros">
          <h2 id="titulo-filtros" className="sr-only">Filtros</h2>
          <PanelPlegable titulo="Filtros" abiertoInicial={activos.length > 0}>
            <form action="/catalogo" method="get" className="tarjeta space-y-4" role="search" aria-label="Buscar y filtrar oportunidades">
              <div>
                <label htmlFor="q" className="etiqueta-campo">Buscar por texto</label>
                <input id="q" name="q" type="search" defaultValue={filtros.q} className="campo" placeholder="Nombre, institución, ciudad…" />
              </div>
              <Selector id="estado" etiquetaTexto="Estado de la convocatoria" valor={filtros.estado} opciones={pares(ESTADOS)} todos="Todos los estados" />
              <Selector id="pais" etiquetaTexto="País" valor={filtros.pais} opciones={paises.map((p) => [p, p])} todos="Todos los países" />
              <Selector id="area" etiquetaTexto="Área de estudio" valor={filtros.area} opciones={AREAS.map((a) => [a, a])} todos="Todas las áreas" />
              <Selector id="nivel" etiquetaTexto="Nivel" valor={filtros.nivel} opciones={pares(NIVELES)} todos="Todos los niveles" />
              <Selector id="modalidad" etiquetaTexto="Modalidad" valor={filtros.modalidad} opciones={pares(MODALIDADES)} todos="Todas las modalidades" />
              <Selector id="idioma" etiquetaTexto="Idioma" valor={filtros.idioma} opciones={IDIOMAS.map((i) => [i, i])} todos="Todos los idiomas" />
              <Selector id="financiamiento" etiquetaTexto="Tipo de financiamiento" valor={filtros.financiamiento} opciones={pares(FINANCIAMIENTOS)} todos="Cualquier financiamiento" />
              <div>
                <Selector
                  id="costoMax"
                  etiquetaTexto="Costo total máximo"
                  valor={filtros.costoMax}
                  opciones={COSTOS.map((c) => [String(c), `Hasta ${c.toLocaleString("es-PE")} USD`])}
                  todos="Sin límite"
                />
                <p className="mt-1 text-xs text-suave">Matrícula + costo de vida + otros costos, convertido a dólares con un tipo de cambio referencial.</p>
              </div>
              <fieldset>
                <legend className="etiqueta-campo">Fecha de inicio de clases</legend>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label htmlFor="inicioDesde" className="text-sm text-suave">Desde</label>
                    <input id="inicioDesde" name="inicioDesde" type="date" defaultValue={filtros.inicioDesde} className="campo" />
                  </div>
                  <div>
                    <label htmlFor="inicioHasta" className="text-sm text-suave">Hasta</label>
                    <input id="inicioHasta" name="inicioHasta" type="date" defaultValue={filtros.inicioHasta} className="campo" />
                  </div>
                </div>
              </fieldset>
              <Selector
                id="orden"
                etiquetaTexto="Ordenar por"
                valor={filtros.orden}
                opciones={[["costo", "Menor costo total"], ["inicio", "Fecha de inicio más cercana"], ["actualizacion", "Actualización más reciente"]]}
                todos="Fecha de cierre más cercana"
              />
              <div className="flex flex-col gap-2">
                <button type="submit" className="btn-primario">Aplicar filtros</button>
                <Link href="/catalogo" className="btn-secundario">Limpiar filtros</Link>
              </div>
            </form>
          </PanelPlegable>
        </aside>

        <section aria-labelledby="titulo-resultados" className="space-y-4">
          <h2 id="titulo-resultados" className="text-lg font-bold" role="status">
            {resultados.length === 1 ? "1 oportunidad encontrada" : `${resultados.length} oportunidades encontradas`}
          </h2>

          {activos.length > 0 && (
            <ul className="flex flex-wrap gap-2" aria-label="Filtros aplicados">
              {activos.map((k) => (
                <li key={k}>
                  <Link
                    href={urlSin(filtros, k)}
                    className="inline-flex min-h-9 items-center gap-1 rounded-full border border-marca bg-marca-clara px-3 text-sm text-marca-oscura hover:bg-white"
                  >
                    <span>{NOMBRES_FILTRO[k]}: {valorLegible(k, filtros[k]!)}</span>
                    <span aria-hidden="true">✕</span>
                    <span className="sr-only">(quitar filtro)</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}

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
