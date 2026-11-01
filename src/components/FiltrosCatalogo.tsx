// Panel de filtros del catálogo, compartido por la lista y el mapa (D51): ambos
// leen los mismos parámetros de la URL, así que un filtro aplicado en una vista
// se conserva al pasar a la otra.
import Link from "next/link";
import {
  AREAS,
  ESTADOS,
  FINANCIAMIENTOS,
  IDIOMAS,
  MODALIDADES,
  NIVELES,
  etiqueta,
} from "@/lib/catalogos";
import { FILTROS_MULTIPLES, aConsulta, type FiltroMultiple, type Filtros } from "@/lib/oportunidades";
import { formatearFechaCorta, desdeISO } from "@/lib/fechas";
import { PanelPlegable } from "@/components/PanelPlegable";

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
function urlSin(base: string, f: Filtros, clave: ClaveFiltro, valor: string): string {
  const copia: Filtros = { ...f };
  if ((FILTROS_MULTIPLES as readonly string[]).includes(clave)) {
    const c = clave as FiltroMultiple;
    copia[c] = (f[c] ?? []).filter((v) => v !== valor);
  } else {
    delete copia[clave as Exclude<ClaveFiltro, FiltroMultiple>];
  }
  const s = aConsulta(copia).toString();
  return s ? `${base}?${s}` : base;
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

const pares = <T extends Record<string, string>>(m: T) => Object.entries(m) as [string, string][];

/** Una entrada por cada opción elegida, para poder quitarlas de a una. */
function filtrosActivos(filtros: Filtros) {
  return (Object.keys(NOMBRES_FILTRO) as ClaveFiltro[]).flatMap((k) => {
    const v = filtros[k];
    return (Array.isArray(v) ? v : v ? [v] : []).map((valor) => ({ clave: k, valor }));
  });
}

export function hayFiltros(filtros: Filtros): boolean {
  return filtrosActivos(filtros).length > 0;
}

/** Formulario de filtros. `base` es la página a la que se envía (/catalogo o /catalogo/mapa). */
export function PanelFiltros({ filtros, paises, base, conOrden = true }: {
  filtros: Filtros; paises: string[]; base: string; conOrden?: boolean;
}) {
  return (
    <aside aria-labelledby="titulo-filtros">
      <h2 id="titulo-filtros" className="sr-only">Filtros</h2>
      <PanelPlegable titulo="Filtros" abiertoInicial={hayFiltros(filtros)}>
        <form action={base} method="get" className="tarjeta space-y-4" role="search" aria-label="Buscar y filtrar oportunidades">
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
          {conOrden && (
            <Selector
              id="orden"
              etiquetaTexto="Ordenar por"
              valor={filtros.orden}
              opciones={[["costo", "Menor costo total"], ["inicio", "Fecha de inicio más cercana"], ["actualizacion", "Actualización más reciente"]]}
              todos="Fecha de cierre más cercana"
            />
          )}
          <div className="flex flex-col gap-2">
            <button type="submit" className="btn-primario">Aplicar filtros</button>
            <Link href={base} className="btn-secundario">Limpiar filtros</Link>
          </div>
        </form>
      </PanelPlegable>
    </aside>
  );
}

/** Etiquetas de los filtros aplicados; cada una quita su opción. */
export function FiltrosAplicados({ filtros, base }: { filtros: Filtros; base: string }) {
  const activos = filtrosActivos(filtros);
  if (!activos.length) return null;
  return (
    <ul className="flex flex-wrap gap-2" aria-label="Filtros aplicados">
      {activos.map(({ clave: k, valor }) => (
        <li key={`${k}-${valor}`}>
          <Link
            href={urlSin(base, filtros, k, valor)}
            className="inline-flex min-h-9 items-center gap-1 rounded-full border border-marca bg-marca-clara px-3 text-sm text-marca-oscura hover:bg-white"
          >
            <span>{NOMBRES_FILTRO[k]}: {valorLegible(k, valor)}</span>
            <span aria-hidden="true">✕</span>
            <span className="sr-only">(quitar filtro)</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
