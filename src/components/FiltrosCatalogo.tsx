// Filtros aplicados y filtros rápidos del catálogo (D54, D60). El formulario está en
// PanelFiltros (componente de cliente). La lista y el mapa leen los mismos parámetros
// de la URL, así que un filtro aplicado en una vista se conserva en la otra.
import Link from "next/link";
import { Check } from "lucide-react";
import { ESTADOS, FINANCIAMIENTOS, MODALIDADES, NIVELES, etiqueta } from "@/lib/catalogos";
import { DIAS_CIERRAN_PRONTO, FILTROS_MULTIPLES, aConsulta, type FiltroMultiple, type Filtros } from "@/lib/oportunidades";
import { formatearFechaCorta, desdeISO } from "@/lib/fechas";

type ClaveFiltro = Exclude<keyof Filtros, "orden">;

const NOMBRES_FILTRO: Record<ClaveFiltro, string> = {
  q: "Texto",
  entidad: "Entidad",
  pronto: "Cierran pronto",
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
    case "pronto": return `en ${DIAS_CIERRAN_PRONTO} días o menos`;
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

/** Filtros rápidos de un toque (D60): cada chip agrega o quita su filtro. */
export function FiltrosRapidos({ filtros, base }: { filtros: Filtros; base: string }) {
  const alternar = (clave: FiltroMultiple, valor: string) => {
    const actuales = filtros[clave] ?? [];
    const nuevos = actuales.includes(valor) ? actuales.filter((v) => v !== valor) : [...actuales, valor];
    return { ...filtros, [clave]: nuevos };
  };
  const chips: { texto: string; activo: boolean; destino: Filtros }[] = [
    { texto: "Becas integrales", activo: !!filtros.financiamiento?.includes("integral"), destino: alternar("financiamiento", "integral") },
    { texto: "Cierran pronto", activo: !!filtros.pronto, destino: { ...filtros, pronto: filtros.pronto ? undefined : "1" } },
    { texto: "En español", activo: !!filtros.idioma?.includes("Español"), destino: alternar("idioma", "Español") },
    { texto: "Virtual", activo: !!filtros.modalidad?.includes("virtual"), destino: alternar("modalidad", "virtual") },
  ];
  return (
    <nav aria-label="Filtros rápidos">
      <ul className="flex gap-2 overflow-x-auto pb-1">
        {chips.map((c) => {
          const s = aConsulta(c.destino).toString();
          return (
            <li key={c.texto} className="shrink-0">
              <Link href={s ? `${base}?${s}` : base} scroll={false}
                className={`inline-flex min-h-11 items-center gap-1.5 rounded-full border-2 px-4 text-sm font-bold no-underline transition-colors duration-150 ${
                  c.activo ? "border-marca bg-marca text-white" : "border-marca-100 bg-white text-marca-oscura hover:border-marca"
                }`}>
                {c.activo && <Check aria-hidden="true" className="h-4 w-4" />}
                {c.texto}
                {c.activo && <span className="sr-only"> (activo; toca para quitarlo)</span>}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
