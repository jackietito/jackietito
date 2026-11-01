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
import { FILTROS_MULTIPLES, aConsulta, filtrarOportunidades, leerFiltros, type FiltroMultiple, type Filtros } from "@/lib/oportunidades";
import { formatearFechaCorta, desdeISO } from "@/lib/fechas";
import { TarjetaOportunidad } from "@/components/oportunidad";
import { PanelPlegable } from "@/components/PanelPlegable";
import { AccionesOportunidad } from "@/components/BotonesOportunidad";
import { contextoAcciones } from "@/lib/contexto";

export const metadata: Metadata = { title: "Catálogo de oportunidades" };

const COSTOS = [5000, 10000, 20000, 40000, 60000, 100000];

type ClaveFiltro = Exclude<keyof Filtros, "orden">;

const NOMBRES_FILTRO: Record<ClaveFiltro, string> = {
  q: "Texto",
  entidad: "Entidad",
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

function valorLegible(clave: ClaveFiltro, valor: string): string {
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

/** URL del catálogo sin un filtro (o sin una de las opciones de un filtro múltiple). */
function urlSin(f: Filtros, clave: ClaveFiltro, valor: string): string {
  const copia: Filtros = { ...f };
  if ((FILTROS_MULTIPLES as readonly string[]).includes(clave)) {
    const c = clave as FiltroMultiple;
    copia[c] = (f[c] ?? []).filter((v) => v !== valor);
  } else {
    delete copia[clave as Exclude<ClaveFiltro, FiltroMultiple>];
  }
  const s = aConsulta(copia).toString();
  return s ? `/catalogo?${s}` : "/catalogo";
}

/** Grupo plegable de casillas para elegir una o varias opciones de un filtro. */
function GrupoCasillas({ id, titulo, opciones, marcadas }: {
  id: FiltroMultiple; titulo: string; opciones: [string, string][]; marcadas: string[];
}) {
  return (
    <details open={marcadas.length > 0} className="rounded-lg border border-gray-400">
      <summary className="flex min-h-11 cursor-pointer items-center justify-between px-3 font-semibold">
        <span>{titulo}</span>
        <span className="text-sm font-normal text-suave">{marcadas.length ? `${marcadas.length} elegido${marcadas.length === 1 ? "" : "s"}` : "Todos"}</span>
      </summary>
      <fieldset className="border-t border-borde px-3 pb-2 pt-1">
        <legend className="sr-only">{titulo}: elige una o varias opciones</legend>
        {opciones.map(([v, texto], i) => (
          <div key={v} className="flex min-h-10 items-center gap-3">
            <input id={`${id}-${i}`} type="checkbox" name={id} value={v} defaultChecked={marcadas.includes(v)} className="h-5 w-5 accent-marca" />
            <label htmlFor={`${id}-${i}`}>{texto}</label>
          </div>
        ))}
      </fieldset>
    </details>
  );
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
  const consulta = aConsulta(filtros).toString();
  const volver = consulta ? `/catalogo?${consulta}` : "/catalogo";
  const resultados = filtrarOportunidades(todas, filtros, hoy);
  const paises = [...new Set(todas.map((o) => o.pais))].sort((a, b) => a.localeCompare(b, "es"));
  // Una etiqueta por cada opción elegida, para poder quitarlas de a una.
  const activos = (Object.keys(NOMBRES_FILTRO) as ClaveFiltro[]).flatMap((k) => {
    const v = filtros[k];
    return (Array.isArray(v) ? v : v ? [v] : []).map((valor) => ({ clave: k, valor }));
  });
  const pares = <T extends Record<string, string>>(m: T) => Object.entries(m) as [string, string][];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="titulo-pagina">Catálogo de oportunidades</h1>
        <p className="mt-2 max-w-3xl text-suave">
          Programas de posgrado y becas en el exterior publicados por {new Set(todas.map((o) => o.entidadId)).size} entidades.
          Cada ficha indica su fuente y la fecha de su última actualización.
        </p>
        <nav aria-label="Vista del catálogo" className="mt-3">
          <Link href="/catalogo/mapa" className="btn-secundario text-sm">Ver en el mapa mundial</Link>
        </nav>
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
              <GrupoCasillas id="pais" titulo="País" opciones={paises.map((p) => [p, p])} marcadas={filtros.pais ?? []} />
              <GrupoCasillas id="area" titulo="Área de estudio" opciones={AREAS.map((a) => [a, a])} marcadas={filtros.area ?? []} />
              <GrupoCasillas id="nivel" titulo="Nivel" opciones={pares(NIVELES)} marcadas={filtros.nivel ?? []} />
              <GrupoCasillas id="modalidad" titulo="Modalidad" opciones={pares(MODALIDADES)} marcadas={filtros.modalidad ?? []} />
              <GrupoCasillas id="idioma" titulo="Idioma" opciones={IDIOMAS.map((i) => [i, i])} marcadas={filtros.idioma ?? []} />
              <GrupoCasillas id="financiamiento" titulo="Tipo de financiamiento" opciones={pares(FINANCIAMIENTOS)} marcadas={filtros.financiamiento ?? []} />
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
              {activos.map(({ clave: k, valor }) => (
                <li key={`${k}-${valor}`}>
                  <Link
                    href={urlSin(filtros, k, valor)}
                    className="inline-flex min-h-9 items-center gap-1 rounded-full border border-marca bg-marca-clara px-3 text-sm text-marca-oscura hover:bg-white"
                  >
                    <span>{NOMBRES_FILTRO[k]}: {valorLegible(k, valor)}</span>
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
